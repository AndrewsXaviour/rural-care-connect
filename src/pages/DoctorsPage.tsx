import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { mockDoctors, mockHospitals, DISEASE_SPECIALIZATION, Appointment, Hospital, Doctor } from "@/lib/mockData";
import { appointmentStore } from "@/lib/store";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Stethoscope, ChevronLeft, ChevronDown, Calendar, Clock, ArrowRight, CheckCircle, Loader2, Sparkles } from "lucide-react";

/**
 * Generate mock doctors for a real (non-mock) hospital
 */
const generateDoctorsForHospital = (hospitalId: string): Doctor[] => {
  const specializations = [
    "General Physician",
    "Cardiologist",
    "Dermatologist",
    "Orthopedic",
    "Pediatrician",
    "Gynecologist",
  ];
  const firstNames = ["Priya", "Rajesh", "Anita", "Suresh", "Meera", "Vikram"];
  const lastNames = ["Sharma", "Kumar", "Desai", "Patel", "Joshi", "Singh"];
  const timeSlots = [
    ["09:00", "10:00", "11:00", "14:00", "15:00"],
    ["10:00", "11:00", "16:00"],
    ["09:00", "10:30", "14:00", "15:30"],
    ["11:00", "14:00", "16:00"],
    ["09:00", "10:00", "11:00"],
    ["14:00", "15:00", "16:00"],
  ];

  const seed = hospitalId.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const count = 3 + (seed % 2);

  return Array.from({ length: count }, (_, i) => ({
    id: `gen-${hospitalId}-d${i}`,
    name: `Dr. ${firstNames[(seed + i) % firstNames.length]} ${lastNames[(seed + i) % lastNames.length]}`,
    specialization: specializations[(seed + i) % specializations.length],
    hospitalId,
    availableSlots: timeSlots[(seed + i) % timeSlots.length],
  }));
};

const DoctorsPage = () => {
  const { hospitalId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuthContext();

  const [hospital, setHospital] = useState<Hospital | undefined>(
    mockHospitals.find((h) => h.id === hospitalId)
  );

  useEffect(() => {
    if (!hospital && hospitalId) {
      try {
        const cachedHospitals = localStorage.getItem("cached_hospitals_list");
        if (cachedHospitals) {
          const parsed: Hospital[] = JSON.parse(cachedHospitals);
          const found = parsed.find((h) => h.id === hospitalId);
          if (found) setHospital(found);
        }
      } catch {
        // Ignore JSON parse errors
      }
    }
  }, [hospital, hospitalId]);

  const [disease, setDisease] = useState("");
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [booked, setBooked] = useState<Appointment | null>(null);
  const [booking, setBooking] = useState(false);

  const specialization = disease ? DISEASE_SPECIALIZATION[disease.toLowerCase()] : null;

  const doctors = useMemo(() => {
    const isMockHospital = mockHospitals.some((h) => h.id === hospitalId);
    
    let allDoctors: Doctor[];
    if (isMockHospital) {
      allDoctors = mockDoctors.filter((d) => d.hospitalId === hospitalId);
    } else {
      allDoctors = generateDoctorsForHospital(hospitalId || "");
    }

    if (specialization) {
      allDoctors = allDoctors.filter((d) => d.specialization === specialization);
    }
    return allDoctors;
  }, [hospitalId, specialization]);

  const doctor = doctors.find((d) => d.id === selectedDoctor) || 
    mockDoctors.find((d) => d.id === selectedDoctor);

  const bookSlot = async () => {
    if (!selectedDoctor || !selectedDate || !selectedTime || !user) {
      toast.error("Please select doctor, date and time");
      return;
    }

    setBooking(true);
    try {
      const appt: Appointment = {
        id: crypto.randomUUID(),
        patientId: user.uid,
        doctorId: selectedDoctor,
        hospitalId: hospitalId!,
        date: selectedDate,
        time: selectedTime,
        status: "booked",
      };
      await appointmentStore.add(appt);

      // Cache doctor and hospital info for the appointments page
      try {
        const cachedDoctors = JSON.parse(localStorage.getItem("cached_doctors") || "{}");
        if (doctor) {
          cachedDoctors[selectedDoctor] = doctor;
        }
        localStorage.setItem("cached_doctors", JSON.stringify(cachedDoctors));

        if (hospital) {
          const cachedHospitals = JSON.parse(localStorage.getItem("cached_hospitals_map") || "{}");
          cachedHospitals[hospitalId!] = hospital;
          localStorage.setItem("cached_hospitals_map", JSON.stringify(cachedHospitals));
        }
      } catch {
        // Ignore localStorage errors
      }

      setBooked(appt);
      toast.success("Appointment booked!");
    } catch {
      toast.error("Failed to book appointment. Please try again.");
    } finally {
      setBooking(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.05 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 400, damping: 30 } },
  };

  if (booked) {
    return (
      <div className="max-w-md mx-auto mt-20">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20 }}
          className="glass-card p-10 text-center space-y-6 relative overflow-hidden"
        >
          <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/20 via-transparent to-transparent opacity-50 pointer-events-none blur-3xl"></div>
          <div className="w-20 h-20 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto relative z-10">
            <CheckCircle className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-2xl font-bold text-white relative z-10">Appointment Confirmed</h2>
          
          <div className="bg-secondary/50 rounded-2xl p-5 space-y-3 text-sm text-left border border-white/5 relative z-10">
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Doctor</span>
              <span className="text-white font-medium">{doctor?.name}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Facility</span>
              <span className="text-white font-medium max-w-[150px] truncate">{hospital?.name || "Hospital"}</span>
            </div>
            <div className="flex justify-between border-b border-white/5 pb-2">
              <span className="text-gray-400">Date</span>
              <span className="text-primary font-medium">{booked.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Time</span>
              <span className="text-primary font-medium">{booked.time}</span>
            </div>
          </div>
          
          <button onClick={() => navigate("/appointments")} className="btn-primary-glow w-full mt-4 relative z-10">
            View My Appointments
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={containerVariants}
      initial="hidden"
      animate="show"
      className="space-y-6 relative"
    >
      <motion.div variants={itemVariants} className="space-y-2">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 tracking-tight">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-white transition-colors">
            <ChevronLeft className="w-6 h-6" />
          </button>
          Select Specialist
        </h1>
        <p className="text-gray-400 text-sm ml-9">{hospital?.name || "Hospital Database"}</p>
      </motion.div>

      <motion.div variants={itemVariants} className="glass-card p-4 flex items-center gap-3 relative focus-within:ring-1 focus-within:ring-primary/50 transition-shadow z-20">
        <Stethoscope className="w-5 h-5 text-gray-500 flex-shrink-0" />
        <div className="flex-1">
          <input
            type="text"
            placeholder="Describe your symptoms (e.g., fever, skin rash...)"
            value={disease}
            onChange={(e) => setDisease(e.target.value)}
            className="w-full bg-transparent border-none text-white placeholder:text-gray-500 focus:outline-none focus:ring-0 text-sm"
          />
        </div>
        <AnimatePresence>
          {specialization && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute -bottom-10 left-0 bg-primary/20 border border-primary/30 text-primary text-xs px-3 py-1.5 rounded-full backdrop-blur-md font-medium flex items-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-3 h-3" />
              AI suggests: {specialization}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {doctors.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-card p-12 text-center border-dashed border-white/10 mt-8">
          <Stethoscope className="w-10 h-10 text-gray-500 opacity-50 mx-auto mb-4" />
          <p className="text-white font-medium">No specialized doctors available</p>
          <p className="text-sm text-gray-500 mt-2">Try adjusting your symptom description.</p>
        </motion.div>
      ) : (
        <div className="grid gap-4 mt-8">
          {doctors.map((doc) => {
            const isSelected = selectedDoctor === doc.id;
            return (
              <motion.div
                variants={itemVariants}
                key={doc.id}
                className={`glass-card-hover p-0 overflow-hidden transition-all duration-500 ${
                  isSelected ? "ring-1 ring-primary/50 shadow-[0_0_30px_rgba(34,197,94,0.15)]" : ""
                }`}
              >
                <div 
                  onClick={() => { 
                    if (!isSelected) {
                      setSelectedDoctor(doc.id); 
                      setSelectedTime(""); 
                    } else {
                      setSelectedDoctor(null);
                    }
                  }}
                  className={`p-5 flex items-center gap-5 relative z-10 cursor-pointer transition-colors duration-300 ${isSelected ? 'bg-primary/5' : ''}`}
                >
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-primary/20 border border-primary/30 shadow-inner scale-110' : 'bg-secondary border border-white/5'}`}>
                    <Stethoscope className={`w-7 h-7 ${isSelected ? 'text-primary' : 'text-gray-500'}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-white">{doc.name}</h3>
                    <p className={`text-sm font-medium transition-colors ${isSelected ? 'text-primary' : 'text-gray-400'}`}>{doc.specialization}</p>
                  </div>
                  <div className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center bg-secondary/50">
                    <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isSelected ? 'rotate-180 text-primary' : 'text-gray-500'}`} />
                  </div>
                </div>

                <AnimatePresence>
                  {isSelected && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="border-t border-white/5 bg-secondary/20"
                    >
                      <div className="p-6 space-y-6">
                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Calendar className="w-3.5 h-3.5" />
                            Select Date
                          </label>
                          <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            min={new Date().toISOString().split("T")[0]}
                            className="w-full bg-secondary border border-white/10 text-white rounded-xl px-4 py-3 focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all font-medium"
                          />
                        </div>

                        <div className="space-y-3">
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <Clock className="w-3.5 h-3.5" />
                            Available Time Slots
                          </label>
                          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                            {doc.availableSlots.map((slot) => (
                              <button
                                key={slot}
                                onClick={(e) => { e.stopPropagation(); setSelectedTime(slot); }}
                                className={`py-2 rounded-lg text-sm font-medium transition-all duration-300 border ${
                                  selectedTime === slot
                                    ? "bg-primary text-background border-primary shadow-md scale-[1.02]"
                                    : "bg-secondary/50 text-gray-400 border-white/5 hover:border-white/20 hover:text-white"
                                }`}
                              >
                                {slot}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="pt-2">
                          <button
                            onClick={(e) => { e.stopPropagation(); bookSlot(); }}
                            disabled={booking || !selectedDate || !selectedTime}
                            className="btn-primary-glow w-full flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {booking ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Orchestrating Booking...
                              </>
                            ) : (
                              <>
                                Confirm Appointment
                                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );
};

export default DoctorsPage;
