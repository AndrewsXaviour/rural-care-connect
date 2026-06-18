import { useState, useEffect } from "react";
import { patientStore } from "@/lib/store";
import { useAuthContext } from "@/hooks/useAuthContext";
import { Patient } from "@/lib/mockData";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { User, CreditCard, Phone, Clock, Ruler, Weight, Home, MapPin, Droplets, Users, ArrowRight, Loader2, LogOut } from "lucide-react";

const BLOOD_GROUPS = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

const ProfilePage = () => {
  const { user, logout } = useAuthContext();
  const [form, setForm] = useState<Partial<Patient>>({
    phone: user?.phoneNumber || "",
  });
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!user) return;
    setLoadingProfile(true);
    patientStore.get(user.uid).then((existing) => {
      if (existing) {
        setForm(existing);
      } else {
        setForm({
          phone: user.phoneNumber || "",
          fullName: user.displayName || "",
        });
      }
      setLoadingProfile(false);
    });
  }, [user]);

  const update = (key: keyof Patient, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const save = async () => {
    if (!form.fullName || !form.aadhaar || !form.bloodGroup || !form.age) {
      toast.error("Please fill all required fields");
      return;
    }
    if (!user) return;

    const patient: Patient = {
      uid: user.uid,
      aadhaar: form.aadhaar || "",
      fullName: form.fullName || "",
      gender: form.gender || "Other",
      phone: form.phone || user.phoneNumber || "",
      bloodGroup: form.bloodGroup || "",
      age: Number(form.age) || 0,
      height: Number(form.height) || 0,
      weight: Number(form.weight) || 0,
      address: form.address || "",
      houseNumber: form.houseNumber || "",
    };

    setSaving(true);
    try {
      await patientStore.save(patient);
      toast.success("Profile saved successfully!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const fields: { key: keyof Patient; label: string; type?: string; placeholder: string; Icon: React.ElementType }[] = [
    { key: "fullName", label: "Full Name", placeholder: "Enter your full name", Icon: User },
    { key: "aadhaar", label: "Aadhaar Number", placeholder: "12-digit Aadhaar number", Icon: CreditCard },
    { key: "phone", label: "Phone Number", placeholder: "Phone number", Icon: Phone },
    { key: "age", label: "Age", type: "number", placeholder: "Your age", Icon: Clock },
    { key: "height", label: "Height (cm)", type: "number", placeholder: "Height in cm", Icon: Ruler },
    { key: "weight", label: "Weight (kg)", type: "number", placeholder: "Weight in kg", Icon: Weight },
    { key: "houseNumber", label: "House Number", placeholder: "House / Flat number", Icon: Home },
    { key: "address", label: "Address", placeholder: "Village, Taluka, District", Icon: MapPin },
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.03 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 500, damping: 30 } },
  };

  if (loadingProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Patient Profile</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
            Loading your information...
          </p>
        </div>
        <div className="glass-card p-8 space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 bg-white/5 rounded w-1/3"></div>
                <div className="h-12 bg-white/5 rounded-xl"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show" 
      className="max-w-2xl mx-auto space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Patient Profile</h1>
          <p className="text-gray-400 text-sm">Manage your health identity.</p>
        </div>
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-blue-500/20 border border-white/10 flex items-center justify-center shadow-inner">
          <User className="w-10 h-10 text-primary/60" />
        </div>
      </motion.div>

      {/* Form Card */}
      <motion.div variants={itemVariants} className="glass-card p-6 sm:p-8 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {fields.map((f) => {
            const FieldIcon = f.Icon;
            return (
              <motion.div key={f.key} variants={itemVariants} className="space-y-2 group">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <FieldIcon className="w-3.5 h-3.5" />
                  {f.label}
                </label>
                <input
                  type={f.type || "text"}
                  placeholder={f.placeholder}
                  value={(form[f.key] as string) || ""}
                  onChange={(e) => update(f.key, f.type === "number" ? e.target.value : e.target.value)}
                  className="w-full bg-secondary border border-white/5 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all placeholder:text-gray-600 group-hover:border-white/10"
                />
              </motion.div>
            );
          })}

          <motion.div variants={itemVariants} className="space-y-2 group">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Droplets className="w-3.5 h-3.5" />
              Blood Group
            </label>
            <select
              value={form.bloodGroup || ""}
              onChange={(e) => update("bloodGroup", e.target.value)}
              className="w-full bg-secondary border border-white/5 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all appearance-none cursor-pointer group-hover:border-white/10"
            >
              <option value="" className="bg-secondary text-gray-500">Select blood group</option>
              {BLOOD_GROUPS.map((bg) => (
                <option key={bg} value={bg} className="bg-secondary text-white">{bg}</option>
              ))}
            </select>
          </motion.div>

          <motion.div variants={itemVariants} className="space-y-2 group">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <Users className="w-3.5 h-3.5" />
              Gender
            </label>
            <select
              value={form.gender || ""}
              onChange={(e) => update("gender", e.target.value)}
              className="w-full bg-secondary border border-white/5 text-white rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all appearance-none cursor-pointer group-hover:border-white/10"
            >
              <option value="" className="bg-secondary text-gray-500">Select gender</option>
              <option value="Male" className="bg-secondary text-white">Male</option>
              <option value="Female" className="bg-secondary text-white">Female</option>
              <option value="Other" className="bg-secondary text-white">Other</option>
            </select>
          </motion.div>
        </div>

        <motion.div variants={itemVariants} className="pt-4 border-t border-white/5">
          <button 
            onClick={save} 
            disabled={saving} 
            className="btn-primary-glow w-full flex items-center justify-center gap-2 group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving Profile...
              </>
            ) : (
              <>
                Save Profile
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </motion.div>
      </motion.div>

      {/* Sign out */}
      <motion.div variants={itemVariants} className="flex justify-center">
        <button
          onClick={logout}
          className="text-sm text-red-400/80 hover:text-red-400 transition-colors flex items-center gap-2 group"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign Out
        </button>
      </motion.div>
    </motion.div>
  );
};

export default ProfilePage;
