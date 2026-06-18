import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { patientStore } from "@/lib/store";
import { Patient } from "@/lib/mockData";
import { User, LogOut, LogIn, Repeat, UserCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export const ProfileMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  
  const { user, isAuthenticated, logout } = useAuthContext();
  const [profile, setProfile] = useState<Patient | null>(null);

  useEffect(() => {
    if (user?.uid) {
      patientStore.get(user.uid).then(setProfile);
    } else {
      setProfile(null);
    }
  }, [user]);

  useEffect(() => {
    if (isOpen && user?.uid) {
      patientStore.get(user.uid).then(setProfile);
    }
  }, [isOpen, user]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  const handleSwitchAccount = async () => {
    await logout();
    setIsOpen(false);
    navigate("/");
  };

  const handleLogin = () => {
    setIsOpen(false);
    navigate("/");
  };

  // Get initials for avatar
  const getInitials = (): string => {
    const name = profile?.fullName || user?.displayName || "";
    if (!name) return "?";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  };

  const gender = profile?.gender;
  const circleGradient = gender === "Female" 
    ? "from-pink-500 to-rose-600" 
    : gender === "Male" 
      ? "from-blue-500 to-indigo-600"
      : "from-gray-500 to-slate-600";

  return (
    <div className="relative" ref={menuRef}>
      {/* Profile Circle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-11 h-11 rounded-xl bg-gradient-to-br ${circleGradient} flex items-center justify-center shadow-lg hover:shadow-xl transition-all border border-white/20 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-background overflow-hidden hover:scale-105`}
      >
        {isAuthenticated ? (
          <span className="text-sm font-bold text-white select-none">
            {getInitials()}
          </span>
        ) : (
          <UserCircle className="w-6 h-6 text-white" />
        )}
      </button>

      {/* Dropdown Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
            className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 overflow-hidden z-[100]"
          >
            {isAuthenticated ? (
              <>
                <div className="px-4 py-3.5 border-b border-white/5 bg-secondary/30">
                  <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-widest">Signed in as</p>
                  <p className="text-sm font-bold text-white truncate mt-0.5">
                    {user?.displayName || user?.email || user?.phoneNumber || user?.uid}
                  </p>
                </div>
                <div className="p-1.5 space-y-0.5">
                  <button
                    onClick={() => { setIsOpen(false); navigate("/profile"); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    <User className="w-4 h-4 text-gray-500" /> My Profile
                  </button>
                  <button
                    onClick={handleSwitchAccount}
                    className="w-full text-left px-3 py-2.5 text-sm text-gray-300 hover:bg-white/5 hover:text-white rounded-xl transition-colors flex items-center gap-2.5"
                  >
                    <Repeat className="w-4 h-4 text-gray-500" /> Switch Account
                  </button>
                  <div className="h-px bg-white/5 my-1 mx-2"></div>
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-3 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-xl transition-colors flex items-center gap-2.5 font-medium"
                  >
                    <LogOut className="w-4 h-4" /> Log out
                  </button>
                </div>
              </>
            ) : (
              <div className="p-2 space-y-1">
                <div className="px-3 py-2 text-sm text-gray-500 text-center mb-1">
                  You are not logged in
                </div>
                <button
                  onClick={handleLogin}
                  className="w-full px-3 py-2.5 text-sm text-primary bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors flex items-center justify-center gap-2 font-semibold"
                >
                  <LogIn className="w-4 h-4" /> Log In / Sign Up
                </button>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
