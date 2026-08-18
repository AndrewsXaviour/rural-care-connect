import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser, updateUserProfile } from "@/lib/firebaseAuth";
import { FirebaseError } from "firebase/auth";
import { Heart } from "lucide-react";

const SignupPage = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }

    if (!formData.phone || formData.phone.length !== 10) {
      newErrors.phone = "Phone must be 10 digits";
    } else if (!/^[6-9]\d{9}$/.test(formData.phone)) {
      newErrors.phone = "Must start with 6-9";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);
      
      // Create the user account in Firebase
      await registerUser(formData.email, formData.password);
      
      // Update the display name
      await updateUserProfile(formData.name);
      
      // Firebase already creates a session — AuthContext will pick it up
      toast.success("Account created! Welcome to Rural Care Connect.");
      navigate("/dashboard");
    } catch (error: unknown) {
      const fbError = error as FirebaseError;
      // Handle specific Firebase auth error codes
      switch (fbError.code) {
        case "auth/email-already-in-use":
          setErrors((prev) => ({ ...prev, email: "This email is already registered" }));
          toast.error("This email is already registered. Try logging in.");
          break;
        case "auth/weak-password":
          setErrors((prev) => ({ ...prev, password: "Password is too weak" }));
          toast.error("Password is too weak. Use at least 6 characters.");
          break;
        case "auth/invalid-email":
          setErrors((prev) => ({ ...prev, email: "Invalid email address" }));
          toast.error("Invalid email address.");
          break;
        case "auth/operation-not-allowed":
          toast.error("Email/password signup is not enabled. Contact support.");
          break;
        case "auth/too-many-requests":
          toast.error("Too many attempts. Please try again later.");
          break;
        default:
          toast.error(fbError.message || "Signup failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name === "phone") {
      setFormData({
        ...formData,
        [name]: value.replace(/\D/g, "").slice(0, 10),
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
    
    // Clear error for this field
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col md:flex-row overflow-hidden relative">
      {/* Decorative gradient orbs for background */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none" />
      
      {/* Left Side: Aesthetic Hero */}
      <div className="hidden md:flex flex-col flex-1 relative items-center justify-center p-12 overflow-hidden border-r border-white/5">
        <div className="absolute inset-0 bg-black/60 z-0"></div>
        {/* Subtle grid pattern over the dark side */}
        <div className="absolute inset-0 bg-grid-pattern opacity-30 z-0"></div>
        
        <div className="relative z-10 w-full max-w-lg text-center">
          <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.3)] backdrop-blur-md">
            <Heart className="w-12 h-12 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Join the Network
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Create an account to securely access local healthcare professionals, view integrated medical records, and manage your appointments.
          </p>
          
          <div className="flex gap-4 justify-center mt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-1 rounded-full bg-white/10 overflow-hidden relative">
                <div 
                  className={`absolute inset-y-0 left-0 bg-primary w-full ${i === 2 ? 'opacity-100' : 'opacity-0'}`} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10 w-full max-h-screen overflow-y-auto custom-scrollbar">
        <div className="w-full max-w-md space-y-8 glass-card p-8 sm:p-10 relative my-auto">
          
          <div className="md:hidden text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-white">Rural Care Connect</h2>
          </div>

          <div className="space-y-2 text-center md:text-left mb-6">
            <h2 className="text-3xl font-bold tracking-tight text-white">Create Account</h2>
            <p className="text-sm text-gray-400">Enter your details to get started.</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 animate-fade-in">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                Full Name
              </label>
              <Input
                type="text"
                name="name"
                placeholder="Jane Doe"
                value={formData.name}
                onChange={handleChange}
                disabled={loading}
                className={`h-12 bg-secondary/50 border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-colors ${
                  errors.name ? "border-red-500/50" : ""
                }`}
              />
              {errors.name && (
                <p className="text-red-400 text-xs mt-1">{errors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                Email Address
              </label>
              <Input
                type="email"
                name="email"
                placeholder="jane@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={loading}
                className={`h-12 bg-secondary/50 border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-colors ${
                  errors.email ? "border-red-500/50" : ""
                }`}
              />
              {errors.email && (
                <p className="text-red-400 text-xs mt-1">{errors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2 relative group">
              <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                Mobile Number
              </label>
              <div className="flex gap-2 relative">
                <div className="bg-secondary/50 px-4 flex items-center justify-center text-sm font-semibold text-gray-300 rounded-xl border border-border border-r-0 rounded-r-none z-10 transition-colors group-focus-within:border-primary/50">
                  +91
                </div>
                <Input
                  type="tel"
                  name="phone"
                  placeholder="Enter 10 digits"
                  value={formData.phone}
                  onChange={handleChange}
                  maxLength={10}
                  disabled={loading}
                  className={`h-12 bg-secondary/50 border-l-0 rounded-l-none pl-2 focus-visible:ring-0 focus-visible:border-primary/50 transition-colors ${
                    errors.phone ? "border-red-500/50" : "border-border"
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-red-400 text-xs mt-1">{errors.phone}</p>
              )}
            </div>

            {/* Passwords Flex Row */}
            <div className="flex gap-4">
              <div className="space-y-2 flex-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Password
                </label>
                <Input
                  type="password"
                  name="password"
                  placeholder="Min. 6 chars"
                  value={formData.password}
                  onChange={handleChange}
                  disabled={loading}
                  className={`h-12 bg-secondary/50 border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-colors ${
                    errors.password ? "border-red-500/50" : ""
                  }`}
                />
                {errors.password && (
                  <p className="text-red-400 text-xs mt-1">{errors.password}</p>
                )}
              </div>

              <div className="space-y-2 flex-1">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider ml-1">
                  Confirm
                </label>
                <Input
                  type="password"
                  name="confirmPassword"
                  placeholder="Match password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  disabled={loading}
                  className={`h-12 bg-secondary/50 border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-colors ${
                    errors.confirmPassword ? "border-red-500/50" : ""
                  }`}
                />
                {errors.confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary-glow mt-4"
            >
              {loading ? "Creating Account..." : "Create Account"}
            </button>
          </form>

          {/* Login Link */}
          <div className="text-center text-sm text-gray-500 pt-4">
            Already have an account?{" "}
            <button
              onClick={() => navigate("/login")}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Log in
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
