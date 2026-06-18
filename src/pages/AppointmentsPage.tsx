import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { appointmentStore, reportStore } from "@/lib/store";
import { mockDoctors, mockHospitals, Appointment, Doctor, Hospital, MedicalReport } from "@/lib/mockData";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { CalendarCheck, MapPin, ShieldCheck, FileText, ArrowRight, Loader2, Calendar } from "lucide-react";

const AppointmentsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loadingAppts, setLoadingAppts] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingAppts(true);
    appointmentStore.getAll(user.uid).then((appts) => {
      const sorted = [...appts].sort((a, b) => {
        if (a.status === 'booked' && b.status !== 'booked') return -1;
        if (a.status !== 'booked' && b.status === 'booked') return 1;
        return 0;
      });
      setAppointments(sorted);
      setLoadingAppts(false);
    });
  }, [user]);

  const getDoctor = (id: string): Doctor | undefined => {
    const mockDoc = mockDoctors.find((d) => d.id === id);
    if (mockDoc) return mockDoc;

    try {
      const cachedDoctors = JSON.parse(localStorage.getItem("cached_doctors") || "{}");
      if (cachedDoctors[id]) return cachedDoctors[id] as Doctor;
    } catch {
      // Ignore parse errors
    }

    return undefined;
  };

  const getHospital = (id: string): Hospital | undefined => {
    const mockHosp = mockHospitals.find((h) => h.id === id);
    if (mockHosp) return mockHosp;

    try {
      const cachedMap = JSON.parse(localStorage.getItem("cached_hospitals_map") || "{}");
      if (cachedMap[id]) return cachedMap[id] as Hospital;
    } catch {
      // Ignore parse errors
    }

    try {
      const cachedList = localStorage.getItem("cached_hospitals_list");
      if (cachedList) {
        const parsed: Hospital[] = JSON.parse(cachedList);
        const found = parsed.find((h) => h.id === id);
        if (found) return found;
      }
    } catch {
      // Ignore parse errors
    }

    return undefined;
  };

  const handleCompleteCheckup = async (appt: Appointment) => {
    const doctor = getDoctor(appt.doctorId);
    
    await appointmentStore.updateStatus(appt.id, "completed");
    
    const newReport: MedicalReport = {
      id: crypto.randomUUID(),
      patientId: appt.patientId,
      hospitalId: appt.hospitalId,
      testName: "General Health Checkup",
      date: new Date().toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' }),
      status: "Available",
      resultSummary: `A comprehensive general health screening was conducted for the patient. The findings suggest normal cardiac rhythm and stable metabolic parameters. Follow-up consultation with Dr. ${doctor?.name || "the specialist"} is advised in 3 months for routine monitoring.`,
    };
    
    await reportStore.add(newReport);
    
    if (user) {
      const updatedAppts = await appointmentStore.getAll(user.uid);
      setAppointments(updatedAppts);
    }
    toast.success("Checkup completed! Your medical report is now available.");
  };

  const statusConfig: Record<string, { color: string, bg: string, Icon: React.ElementType, label: string }> = {
    booked: { color: "text-primary", bg: "bg-primary/10 border-primary/20", Icon: CalendarCheck, label: "Upcoming" },
    completed: { color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", Icon: ShieldCheck, label: "Completed" },
    cancelled: { color: "text-red-400", bg: "bg-red-500/10 border-red-500/20", Icon: CalendarCheck, label: "Cancelled" },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
  };

  if (loadingAppts) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">My Appointments</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            Syncing timeline...
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse flex flex-col md:flex-row gap-5 border-white/5">
              <div className="w-16 h-16 rounded-2xl bg-white/5"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-white/5 rounded-md w-1/3"></div>
                <div className="h-4 bg-white/5 rounded-md w-1/2"></div>
                <div className="h-4 bg-white/5 rounded-md w-1/4 pt-2 mt-4"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-8 relative"
    >
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="text-3xl font-bold text-white tracking-tight">Appointments Timeline</h1>
        <p className="text-gray-400 text-sm">Manage your scheduled healthcare visits.</p>
      </motion.div>

      {appointments.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-card p-12 text-center border-dashed border-white/10 mt-8 flex flex-col items-center">
          <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
            <Calendar className="w-8 h-8 text-gray-500 opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Your calendar is clear</h3>
          <p className="text-gray-400 max-w-sm mb-8">You have no upcoming or past appointments in the system.</p>
          <button 
            onClick={() => navigate("/hospitals")} 
            className="btn-primary-glow flex items-center gap-2"
          >
            Locate Nearest Hospital
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-5">
          <AnimatePresence>
            {appointments.map((appt) => {
              const doctor = getDoctor(appt.doctorId);
              const hospital = getHospital(appt.hospitalId);
              const config = statusConfig[appt.status] || statusConfig.booked;
              const StatusIcon = config.Icon;
              
              return (
                <motion.div 
                  variants={itemVariants}
                  key={appt.id} 
                  className={`glass-card p-0 overflow-hidden relative group transition-all duration-300 ${appt.status === 'booked' ? 'hover:ring-1 hover:ring-primary/30 shadow-[0_0_15px_rgba(34,197,94,0.05)]' : 'opacity-80 hover:opacity-100'}`}
                >
                  {appt.status === 'booked' && (
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary z-10"></div>
                  )}

                  <div className="p-5 sm:p-6 flex flex-col md:flex-row gap-5">
                    {/* Doctor Info */}
                    <div className="flex items-center gap-5 flex-1 min-w-0">
                      <div className={`w-14 h-14 sm:w-16 sm:h-16 shrink-0 rounded-2xl flex items-center justify-center border shadow-inner ${config.bg}`}>
                        <StatusIcon className={`w-7 h-7 ${config.color}`} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="font-bold text-white text-lg truncate">{doctor?.name || "Dr. Specialist"}</h3>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config.color} ${config.bg}`}>
                            {config.label}
                          </span>
                        </div>
                        <p className="text-sm font-medium text-gray-400 mt-1 truncate">{doctor?.specialization || "General Medicine"}</p>
                        
                        <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-2 truncate">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{hospital?.name || "Healthcare Facility"}</span>
                        </div>
                      </div>
                    </div>

                    {/* Time & Action Container */}
                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between md:justify-center gap-4 border-t border-white/5 md:border-t-0 md:border-l pl-0 md:pl-6 pt-4 md:pt-0 shrink-0">
                      
                      <div className="flex flex-col items-start md:items-end w-full md:w-auto">
                        <span className="text-xl font-black text-white tracking-tight flex items-baseline gap-1.5">
                          {appt.time} <span className="text-xs font-semibold text-gray-500 uppercase">IST</span>
                        </span>
                        <div className="flex flex-col items-start md:items-end">
                           <span className="text-sm text-primary font-semibold">{appt.date}</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => appt.status === "booked" ? handleCompleteCheckup(appt) : navigate("/reports")}
                        className={`w-full md:w-auto relative group/btn flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-sm ${
                          appt.status === "booked" 
                          ? "bg-white text-black hover:bg-primary hover:text-white"
                          : "bg-secondary text-white hover:bg-secondary/80 border border-white/5"
                        }`}
                      >
                        {appt.status === "booked" ? (
                          <>
                            <ShieldCheck className="w-3.5 h-3.5" />
                            Mark Complete
                          </>
                        ) : (
                          <>
                            <FileText className="w-3.5 h-3.5" />
                            View Reports
                          </>
                        )}
                        <div className="absolute inset-0 rounded-xl bg-white/20 blur opacity-0 group-hover/btn:opacity-100 transition-opacity"></div>
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default AppointmentsPage;
