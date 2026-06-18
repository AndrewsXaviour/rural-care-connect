import { useState, useEffect, useCallback } from "react";
import { Patient, mockHospitals, Hospital } from "@/lib/mockData";
import { calculateDistance } from "@/lib/location";
import { toast } from "sonner";
import { AlertCircle, MapPin, User, ShieldAlert, PhoneCall, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

interface EmergencyModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export const EmergencyModal = ({ patient, onClose }: EmergencyModalProps) => {
  const [step, setStep] = useState<"confirm" | "broadcasting" | "sent">("confirm");
  const [countdown, setCountdown] = useState(5);
  const [nearestHospital, setNearestHospital] = useState<Hospital | null>(null);

  // Find nearest hospital on mount
  const findNearestHospital = useCallback(() => {
    const savedLocation = localStorage.getItem("userLocation");
    let closest: Hospital | null = null;

    if (savedLocation) {
      try {
        const { coordinates: { latitude, longitude } } = JSON.parse(savedLocation);
        
        let minDistance = Infinity;
        mockHospitals.forEach(h => {
          const d = calculateDistance(latitude, longitude, h.latitude, h.longitude);
          if (d < minDistance) {
            minDistance = d;
            closest = { ...h, distance: d };
          }
        });
      } catch (e) {
        console.error("Location parse error", e);
      }
    }

    // Fallback if no location or no hospitals found
    if (!closest && mockHospitals.length > 0) {
      closest = mockHospitals[0];
    }

    setNearestHospital(closest);
  }, []);

  useEffect(() => {
    findNearestHospital();
  }, [findNearestHospital]);

  // Countdown for broadcasting
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (step === "broadcasting" && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (step === "broadcasting" && countdown === 0) {
      setStep("sent");
      toast.success("SOS Broadcast Successful!");
    }
    return () => clearTimeout(timer);
  }, [step, countdown]);

  const handleSOS = () => {
    if (!patient) {
      toast.error("Please complete your profile before using Emergency SOS");
      return;
    }
    setStep("broadcasting");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-3xl shadow-2xl shadow-red-500/10 overflow-hidden"
      >
        
        {/* Header — Danger */}
        <div className={`p-6 text-center relative overflow-hidden transition-colors ${step === "sent" ? "bg-green-500/10 border-b border-green-500/20" : "bg-red-500/10 border-b border-red-500/20"}`}>
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-xl transition-colors text-gray-500 hover:text-white"
          >
            ✕
          </button>
          
          <div className={`mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-3 border shadow-inner ${step === "sent" ? "bg-green-500/20 border-green-500/30 text-green-400" : "bg-red-500/20 border-red-500/30 text-red-400"}`}>
             {step === "sent" ? (
               <CheckCircle2 className="w-8 h-8" />
             ) : (
               <ShieldAlert className="w-8 h-8 animate-pulse" />
             )}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-white">
             {step === "confirm" && "Emergency SOS"}
             {step === "broadcasting" && "Sending SOS..."}
             {step === "sent" && "SOS Broadcasted!"}
          </h2>
          <p className={`text-sm mt-1 ${step === "sent" ? "text-green-400/80" : "text-red-400/80"}`}>
             {step === "confirm" && "Immediate Medical Assistance Request"}
             {step === "broadcasting" && `Broadcasting in ${countdown}s`}
             {step === "sent" && "Hospitals are alerted"}
          </p>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          
          {step !== "sent" ? (
            <>
              {/* Patient Snapshot */}
              <div className="bg-secondary/50 border border-white/5 rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sharing Data</p>
                    <p className="text-sm font-bold text-white">{patient?.fullName || "Anonymous Patient"}</p>
                    <p className="text-xs text-gray-400">ID: {patient?.aadhaar || "No Aadhaar Saved"}</p>
                    <div className="flex gap-2 mt-1.5">
                      <span className="px-2 py-0.5 bg-red-500/10 text-red-400 text-[10px] font-bold rounded-full uppercase border border-red-500/20">Blood: {patient?.bloodGroup || "??"}</span>
                      <span className="px-2 py-0.5 bg-secondary text-gray-400 text-[10px] font-bold rounded-full uppercase border border-white/5">Age: {patient?.age || "??"}</span>
                    </div>
                  </div>
                </div>
                
                <div className="h-px bg-white/5"></div>

                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Live Location</p>
                    <p className="text-sm font-medium text-gray-300 line-clamp-1">
                      {nearestHospital ? `Sharing location with ${nearestHospital.name}` : "Detecting surroundings..."}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {step === "confirm" ? (
                  <>
                    <button 
                      onClick={handleSOS}
                      className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-wider text-sm"
                    >
                      <AlertCircle className="w-5 h-5" /> Broadcast SOS to All
                    </button>
                    <button 
                      onClick={onClose}
                      className="w-full py-3 bg-secondary hover:bg-secondary/80 text-gray-400 font-semibold rounded-xl transition-all border border-white/5 text-sm"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => setCountdown(0)}
                    className="w-full py-4 bg-white text-black font-black rounded-2xl shadow-xl animate-pulse uppercase tracking-wider text-sm"
                  >
                    Send Now
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="text-center py-4 space-y-6">
               <div className="space-y-2">
                 <p className="font-bold text-white text-lg">Alert Sent Successfully!</p>
                 <p className="text-sm text-gray-400 px-4">
                   Your medical profile and GPS location have been shared with:
                 </p>
               </div>

               <div className="bg-green-500/10 border border-green-500/20 p-5 rounded-2xl mx-auto max-w-[280px]">
                 <p className="text-[10px] font-black text-green-400 mb-1 uppercase tracking-widest">Nearest Responder</p>
                 <p className="font-bold text-white">{nearestHospital?.name}</p>
                 <p className="text-xs text-gray-400 mt-0.5">{nearestHospital?.address}</p>
                 <p className="text-xs text-green-400 mt-2 font-semibold">{nearestHospital?.distance} km away • ETA: 12 mins</p>
               </div>

               <div className="flex flex-col gap-3">
                 <button className="w-full py-4 bg-primary text-background font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 text-sm">
                   <PhoneCall className="w-5 h-5" /> Call Hospital Desk
                 </button>
                 <button 
                   onClick={onClose}
                   className="w-full py-3 text-gray-500 font-medium hover:text-gray-400 transition-colors text-sm"
                 >
                   Dismiss
                 </button>
               </div>
            </div>
          )}

        </div>

        {/* Footer Notice */}
        <div className="bg-secondary/30 px-6 py-4 text-center border-t border-white/5">
           <p className="text-[10px] text-gray-600 font-medium italic">
             RuralCare Connect Emergency Protocol V2.1 • Encrypted Data Transmission Active
           </p>
        </div>
      </motion.div>
    </div>
  );
};
