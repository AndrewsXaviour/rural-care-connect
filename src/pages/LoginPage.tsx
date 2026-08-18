import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  signInWithGoogle,
  sendPhoneOtp,
  verifyPhoneOtp,
} from "@/lib/firebaseAuth";
import { ConfirmationResult, RecaptchaVerifier, FirebaseError } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Heart } from "lucide-react";

const LoginPage = () => {
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [phoneError, setPhoneError] = useState("");
  const [otpError, setOtpError] = useState("");
  const navigate = useNavigate();
  const confirmationResultRef = useRef<ConfirmationResult | null>(null);
  const recaptchaVerifierRef = useRef<RecaptchaVerifier | null>(null);

  // Validate phone number
  const validatePhoneNumber = (phoneNumber: string): boolean => {
    setPhoneError("");

    if (!phoneNumber || phoneNumber.length === 0) {
      setPhoneError("Phone number is required");
      return false;
    }

    if (phoneNumber.length !== 10) {
      setPhoneError("Phone number must be 10 digits");
      return false;
    }

    if (!/^[6-9]\d{9}$/.test(phoneNumber)) {
      setPhoneError("Invalid number. Must start with 6-9");
      return false;
    }

    return true;
  };

  // Send OTP
  const handleSendOtp = async () => {
    if (!validatePhoneNumber(phone)) {
      return;
    }

    try {
      setLoading(true);
      const phoneNumber = "+91" + phone;

      // Create reCAPTCHA verifier using auth instance
      if (!recaptchaVerifierRef.current) {
        try {
          recaptchaVerifierRef.current = new RecaptchaVerifier(
            auth,
            "recaptcha-container",
            {
              size: "invisible",
            }
          );
        } catch {
          toast.error("Security verification unavailable. Try again.");
          return;
        }
      }

      const confirmationResult = await sendPhoneOtp(
        phoneNumber,
        recaptchaVerifierRef.current
      );

      confirmationResultRef.current = confirmationResult;
      setOtpSent(true);
      toast.success("OTP sent! Check your phone.");
    } catch (error: unknown) {
      const fbError = error as FirebaseError;

      if (fbError.code === "auth/invalid-phone-number") {
        setPhoneError("Invalid phone format");
      } else if (fbError.code === "auth/too-many-requests") {
        toast.error("Too many requests. Wait a few minutes.");
      } else {
        toast.error(fbError.message || "Failed to send OTP");
      }

      // Reset recaptcha on error
      recaptchaVerifierRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP
  const handleVerifyOtp = async () => {
    setOtpError("");

    if (!otp || otp.length === 0) {
      setOtpError("Enter OTP");
      return;
    }

    if (otp.length !== 6) {
      setOtpError("OTP must be 6 digits");
      return;
    }

    try {
      setLoading(true);

      if (!confirmationResultRef.current) {
        setOtpSent(false);
        toast.error("Session expired. Send OTP again.");
        return;
      }

      await verifyPhoneOtp(confirmationResultRef.current, otp);

      // Firebase Auth session is now active — AuthContext will pick it up
      toast.success("Login successful!");
      navigate("/dashboard");
    } catch (error: unknown) {
      const fbError = error as FirebaseError;

      if (fbError.code === "auth/invalid-verification-code") {
        setOtpError("Wrong OTP. Try again.");
      } else if (fbError.code === "auth/code-expired") {
        setOtpError("OTP expired. Request new one.");
        setOtpSent(false);
      } else {
        setOtpError(fbError.message || "Verification failed");
      }
    } finally {
      setLoading(false);
    }
  };

  // Google Sign-In via popup
  const handleGoogleSignIn = async () => {
    try {
      setLoadingGoogle(true);
      await signInWithGoogle();
      toast.success("Logged in!");
      navigate("/dashboard");
    } catch (error: unknown) {
      const fbError = error as FirebaseError;
      
      // If authentication actually succeeded but the popup threw a COOP error on close, 
      // navigate anyway if auth.currentUser exists.
      if (auth.currentUser) {
        toast.success("Logged in successfully (Popup closed)");
        navigate("/dashboard");
        return;
      }
      
      if (fbError.code !== "auth/popup-closed-by-user") {
        toast.error(fbError.message || "Google sign-in failed");
      }
    } finally {
      setLoadingGoogle(false);
    }
  };

  // Navigate to sign up
  const handleSignUp = () => {
    navigate("/signup");
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
        
        <div className="relative z-10 w-full max-w-lg text-center setup-anim">
          <div className="w-24 h-24 rounded-3xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-8 shadow-[0_0_40px_rgba(34,197,94,0.3)] backdrop-blur-md">
            <Heart className="w-12 h-12 text-primary" fill="currentColor" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold tracking-tight text-white mb-6">
            Rural Care Connect
          </h1>
          <p className="text-lg text-gray-400 mb-8 leading-relaxed">
            Premium healthcare access brought directly to your community. Secure, seamless, and intelligent medical assistance.
          </p>
          
          <div className="flex gap-4 justify-center mt-12">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-16 h-1 rounded-full bg-white/10 overflow-hidden relative">
                <div 
                  className={`absolute inset-y-0 left-0 bg-primary w-full ${i === 1 ? 'opacity-100' : 'opacity-0'}`} 
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Side: Auth Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-12 z-10">
        <div className="w-full max-w-md space-y-8 glass-card p-8 sm:p-10 relative">
          
          <div className="md:hidden text-center mb-8">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 border border-primary/30 flex items-center justify-center mx-auto mb-4">
              <Heart className="w-8 h-8 text-primary" fill="currentColor" />
            </div>
            <h2 className="text-2xl font-bold text-white">Rural Care Connect</h2>
          </div>

          <div className="space-y-2 text-center md:text-left">
            <h2 className="text-3xl font-bold tracking-tight text-white">Welcome back</h2>
            <p className="text-sm text-gray-400">Sign in to orchestrate your healthcare.</p>
          </div>

          {/* Google Sign-In */}
          <button
            onClick={handleGoogleSignIn}
            disabled={loadingGoogle || loading}
            className="w-full flex items-center justify-center gap-3 bg-secondary/50 hover:bg-secondary border border-border text-foreground font-medium py-3.5 px-4 rounded-xl transition-all duration-300 shadow-sm disabled:opacity-50 group hover:border-primary/50"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" className="group-hover:scale-110 transition-transform duration-300">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h5.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.47-.98 7.28-2.66l-5.57-2.77c-.81.55-1.87.9-3.07.9-2.35 0-4.34-1.59-4.59-3.73H2.18v2.86C4.03 20.06 7.84 23 12 23z" fill="#34A853"/>
              <path d="M7.41 14.84c-.1-1.58-.1-2.84-.1-3.08s.1-1.47.1-3.08H2.18V7.5c1.83-3.57 5.66-6.5 9.82-6.5 2.97 0 5.47.98 7.28 2.66l-5.57 2.77c-.81-.55-1.87-.9-3.07-.9-2.35 0-4.34 1.59-4.59 3.73z" fill="#EA4335"/>
              <path d="M2.18 6.4v2.86h5.24c-.26-1.37-1.04-2.53-2.21-3.31L2.18 6.4z" fill="#FBBC04"/>
            </svg>
            Continue with Google
          </button>

          <div className="flex items-center gap-4">
            <div className="flex-1 h-px bg-border"></div>
            <span className="text-gray-500 text-xs font-semibold tracking-widest uppercase">OR</span>
            <div className="flex-1 h-px bg-border"></div>
          </div>

          {/* Phone Authentication */}
          {!otpSent ? (
            <div className="space-y-5 animate-fade-in">
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
                    placeholder="Enter 10 digits"
                    value={phone}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                      setPhone(val);
                      setPhoneError("");
                    }}
                    maxLength={10}
                    disabled={loading}
                    className={`h-12 bg-secondary/50 border-l-0 rounded-l-none pl-2 text-lg focus-visible:ring-0 focus-visible:border-primary/50 transition-colors ${
                      phoneError ? "border-red-500/50" : "border-border"
                    }`}
                  />
                </div>
                {phoneError && (
                  <p className="text-red-400 text-xs mt-1 absolute -bottom-5 left-1">{phoneError}</p>
                )}
              </div>

              <button
                onClick={handleSendOtp}
                disabled={loading || phone.length < 10}
                className="w-full btn-primary-glow mt-4"
              >
                {loading ? "Initializing Secure Context..." : "Send Secure Code"}
              </button>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4 text-center">
                <p className="text-sm text-primary font-medium">
                  Authentication code sent to +91 {phone}
                </p>
              </div>

              <div className="space-y-2 text-center">
                <label className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Enter 6-digit Code
                </label>
                <div>
                  <Input
                    type="text"
                    placeholder="• • • • • •"
                    value={otp}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                      setOtp(val);
                      setOtpError("");
                    }}
                    maxLength={6}
                    disabled={loading}
                    className={`h-14 text-center text-3xl tracking-[0.5em] font-medium bg-secondary/50 border-border focus-visible:ring-0 focus-visible:border-primary/50 transition-colors ${
                      otpError ? "border-red-500/50" : ""
                    }`}
                  />
                  {otpError && (
                    <p className="text-red-400 text-xs mt-2">{otpError}</p>
                  )}
                </div>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={loading || otp.length < 6}
                className="w-full btn-primary-glow"
              >
                {loading ? "Verifying..." : "Verify & Seamless Login"}
              </button>

              <button
                onClick={() => {
                  setOtpSent(false);
                  setOtp("");
                  setOtpError("");
                }}
                disabled={loading}
                className="w-full text-center text-sm text-gray-500 hover:text-primary transition-colors font-medium mt-2"
              >
                Use a different number
              </button>
            </div>
          )}

          <div className="text-center text-sm text-gray-500 mt-8">
            New to the platform?{" "}
            <button
              onClick={handleSignUp}
              className="text-primary hover:text-primary/80 font-medium transition-colors"
            >
              Sign up
            </button>
          </div>
        </div>
      </div>

      <div id="recaptcha-container" style={{ display: "none" }}></div>
    </div>
  );
};

export default LoginPage;
