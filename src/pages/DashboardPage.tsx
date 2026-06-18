import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { patientStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { Patient } from "@/lib/mockData";
import { EmergencyModal } from "@/components/EmergencyModal";
import { motion } from "framer-motion";
import { Building2, CalendarCheck, FileBarChart, ShieldAlert, UserCircle, ArrowRight, Droplets, Clock } from "lucide-react";

const DashboardPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [showEmergency, setShowEmergency] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    patientStore.get(user.uid).then((p) => {
      setPatient(p);
      setLoadingProfile(false);
    });
  }, [user]);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } },
  };

  return (
    <motion.div 
      className="space-y-8 relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.div variants={itemVariants} className="space-y-2 pt-2">
        <h1 className="text-4xl font-bold tracking-tight text-white drop-shadow-md">
          Welcome back{patient ? `, ${patient.fullName.split(" ")[0]}` : ""}
        </h1>
        <p className="text-gray-400 text-lg">Your intelligent healthcare command center.</p>
      </motion.div>

      {/* Main Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5 auto-rows-[minmax(180px,auto)]">
        
        {/* Profile Card - Spans 2 columns */}
        <motion.div variants={itemVariants} className="md:col-span-2">
          {loadingProfile ? (
            <div className="glass-card h-full p-8 animate-pulse flex items-center gap-6">
              <div className="w-20 h-20 rounded-2xl bg-white/5"></div>
              <div className="flex-1 space-y-4">
                <div className="h-6 bg-white/5 rounded-md w-1/2"></div>
                <div className="h-4 bg-white/5 rounded-md w-1/3"></div>
              </div>
            </div>
          ) : patient ? (
            <div className="glass-card h-full p-8 flex flex-col justify-center relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-[80px] -mr-10 -mt-10 pointer-events-none transition-opacity duration-500 group-hover:opacity-100 opacity-50"></div>
              <div className="flex items-center gap-6 relative z-10">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/20 flex items-center justify-center shadow-inner">
                  <UserCircle className="w-10 h-10 text-primary/70" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-white mb-2">{patient.fullName}</h2>
                  <div className="flex gap-4 text-sm text-gray-400 font-medium">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-primary/60" />Age: {patient.age}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-red-400/60" />Blood: {patient.bloodGroup}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="glass-card h-full p-8 flex flex-col items-center justify-center text-center space-y-4 group overflow-hidden relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 to-blue-500/20 blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <p className="text-lg text-gray-300 relative z-10">Complete your profile to unlock all features</p>
              <button onClick={() => navigate("/profile")} className="btn-primary-glow relative z-10 w-full sm:w-auto">
                Set Up Profile
              </button>
            </div>
          )}
        </motion.div>

        {/* Emergency Card */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <button
            onClick={() => setShowEmergency(true)}
            className="w-full h-full glass-card hover:bg-red-500/10 border-white/5 hover:border-red-500/30 transition-all duration-500 p-8 flex flex-col justify-center items-center text-center group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-red-500/5 translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"></div>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-red-500/20 transition-all duration-300">
              <ShieldAlert className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-bold text-red-100 group-hover:text-red-400 transition-colors">Emergency SOS</h3>
            <p className="text-sm text-gray-500 mt-2">Get immediate assistance</p>
          </button>
        </motion.div>

        {/* Hospitals Card */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <button
            onClick={() => navigate("/hospitals")}
            className="w-full h-full glass-card-hover p-6 flex flex-col group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <Building2 className="w-20 h-20" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center mb-4">
              <Building2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">Find Hospitals</h3>
            <p className="text-sm text-gray-400 mt-1">Locate top-tier healthcare facilities nearby</p>
            <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              Explore <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </motion.div>

        {/* Appointments Card */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <button
            onClick={() => navigate("/appointments")}
            className="w-full h-full glass-card-hover p-6 flex flex-col group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <CalendarCheck className="w-20 h-20" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center mb-4">
              <CalendarCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">Appointments</h3>
            <p className="text-sm text-gray-400 mt-1">View and manage your scheduled visits</p>
            <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View all <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </motion.div>
        
        {/* Reports Card */}
        <motion.div variants={itemVariants} className="md:col-span-1">
          <button
            onClick={() => navigate("/reports")}
            className="w-full h-full glass-card-hover p-6 flex flex-col group relative overflow-hidden text-left"
          >
            <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
              <FileBarChart className="w-20 h-20" />
            </div>
            <div className="w-12 h-12 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 flex items-center justify-center mb-4">
              <FileBarChart className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white group-hover:text-primary transition-colors">Medical Records</h3>
            <p className="text-sm text-gray-400 mt-1">Access your comprehensive lab reports</p>
            <div className="mt-auto pt-4 flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity">
              View records <ArrowRight className="w-3 h-3" />
            </div>
          </button>
        </motion.div>

      </div>

      {showEmergency && (
        <EmergencyModal 
          patient={patient} 
          onClose={() => setShowEmergency(false)} 
        />
      )}
    </motion.div>
  );
};

export default DashboardPage;
