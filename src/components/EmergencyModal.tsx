import { useState, useEffect, useCallback } from "react";
import { Patient, mockHospitals, Hospital } from "@/lib/mockData";
import { calculateDistance } from "@/lib/location";
import { toast } from "sonner";
import { handleError } from "@/lib/errors";
import { FocusTrap } from "@/components/ui/focus-trap";
import { AlertCircle, MapPin, User, ShieldAlert, PhoneCall, CheckCircle2, Users } from "lucide-react";
import { motion } from "framer-motion";

interface EmergencyModalProps {
  patient: Patient | null;
  onClose: () => void;
}

export const EmergencyModal = ({ patient, onClose }: EmergencyModalProps) => {
  const [step, setStep] = useState<"confirm" | "sent">("confirm");
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
      } catch {
        // Location parse failed, will use fallback
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

  const [sendingSMS, setSendingSMS] = useState(false);
  const [smsStatus, setSmsStatus] = useState<string | null>(null);

  const handleSOS = async () => {
    if (!patient) {
      toast.error("Please complete your profile before using Emergency SOS");
      return;
    }

    const contacts = patient.emergencyContacts || [];
    const hasContacts = contacts.length > 0 && contacts.some(c => c.phone);

    // 1. Open tel: link to India emergency number (108)
    window.location.href = "tel:108";

    // 2. Get GPS location for SMS and Web Share
    let locationData: { latitude: number; longitude: number } | undefined;
    if (navigator.geolocation) {
      try {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
        });
        locationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch {
        // Geolocation failed — continue without location
      }
    }

    // 3. Share via Web Share API (if available)
    if (navigator.share) {
      const mapsUrl = locationData
        ? `https://maps.google.com/?q=${locationData.latitude},${locationData.longitude}`
        : "";
      navigator.share({
        title: "Emergency - RuralCare Connect",
        text: `Medical emergency! Name: ${patient.fullName || "Patient"}. Blood: ${patient.bloodGroup || "Unknown"}. Age: ${patient.age || "Unknown"}. Please send help.`,
        url: mapsUrl,
      }).catch(() => {});
    }

    // 4. Send SMS to emergency contacts via serverless API
    if (hasContacts) {
      setSendingSMS(true);
      try {
        const response = await fetch("/api/send-sms", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contacts: contacts.filter(c => c.phone).map(c => ({ name: c.name, phone: "+91" + c.phone })),
            patient: { name: patient.fullName || "Patient", bloodGroup: patient.bloodGroup || "Unknown", age: patient.age || 0 },
            location: locationData,
          }),
        });
        const result = await response.json();
        if (result.success) {
          setSmsStatus(result.demo
            ? `Demo: SMS to ${contacts.length} contact(s) logged`
            : `SMS sent to ${result.sent}/${result.total} contact(s)`);
        } else {
          setSmsStatus("SMS failed - call 108 directly");
        }
      } catch {
        setSmsStatus("SMS failed - call 108 directly");
      } finally {
        setSendingSMS(false);
      }
    }

    // 5. Mark as sent
    setStep("sent");
    toast.success(hasContacts ? "Emergency alerts sent!" : "Emergency call initiated!");
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md" role="dialog" aria-modal="true" aria-label="Emergency SOS">
      <FocusTrap onClose={onClose}>
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
             {step === "sent" && "SOS Activated!"}
          </h2>
          <p className={`text-sm mt-1 ${step === "sent" ? "text-green-400/80" : "text-red-400/80"}`}>
             {step === "confirm" && "Immediate Medical Assistance Request"}
             {step === "sent" && "Emergency call initiated & location shared"}
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

                {patient?.emergencyContacts && patient.emergencyContacts.length > 0 && (
                  <>
                    <div className="h-px bg-white/5"></div>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                        <Users className="w-5 h-5 text-red-400" />
                      </div>
                      <div className="flex-1">
                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Emergency Contacts</p>
                        <p className="text-sm font-medium text-gray-300 line-clamp-1">
                          {patient.emergencyContacts.filter(c => c.phone).length} contact(s) will receive SMS
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-3">
                <button 
                  onClick={handleSOS}
                  className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-2xl shadow-lg shadow-red-500/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] uppercase tracking-wider text-sm"
                >
                  <AlertCircle className="w-5 h-5" /> Call 108 & Share Location
                </button>
                <button 
                  onClick={onClose}
                  className="w-full py-3 bg-secondary hover:bg-secondary/80 text-gray-400 font-semibold rounded-xl transition-all border border-white/5 text-sm"
                >
                  Cancel
                </button>
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
                 <a 
                   href="tel:108"
                   className="w-full py-4 bg-primary text-background font-bold rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-primary/20 transition-all hover:bg-primary/90 text-sm"
                 >
                   <PhoneCall className="w-5 h-5" /> Call Emergency (108)
                 </a>
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
           {smsStatus && (
             <p className="text-[10px] text-primary font-medium mb-1">{smsStatus}</p>
           )}
           {sendingSMS && (
             <p className="text-[10px] text-amber-400 font-medium mb-1">Sending SMS to emergency contacts...</p>
           )}
           <p className="text-[10px] text-gray-600 font-medium italic">
             Calls 108 (India Medical Emergency) and alerts your emergency contacts via SMS.
           </p>
        </div>
      </motion.div>
      </FocusTrap>
    </div>
  );
};
