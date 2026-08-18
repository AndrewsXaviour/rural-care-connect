import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "@/hooks/useAuthContext";
import { reportStore } from "@/lib/store";
import { MedicalReport } from "@/lib/mockData";
import { getHospitalName } from "@/lib/hospitalUtils";
import { FileText, CreditCard, ChevronRight, Activity, Hospital as HospitalIcon } from "lucide-react";
import { toast } from "sonner";
import { openRazorpayCheckout, isRazorpayConfigured } from "@/lib/razorpay";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { motion, AnimatePresence } from "framer-motion";

const ReportsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const [reports, setReports] = useState<MedicalReport[]>([]);
  const [unlockedReports, setUnlockedReports] = useState<string[]>([]);
  const [selectedReport, setSelectedReport] = useState<MedicalReport | null>(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewingResult, setViewingResult] = useState<MedicalReport | null>(null);
  const [loadingReports, setLoadingReports] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    setLoadingReports(true);
    reportStore.getAllForUser(user.uid).then((userReports) => {
      setReports(userReports);
      setLoadingReports(false);
    });
    
    try {
      const unlocked = JSON.parse(localStorage.getItem(`unlocked_reports_${user.uid}`) || "[]");
      setUnlockedReports(unlocked);
    } catch {
      setUnlockedReports([]);
    }
  }, [user]);

  const handleUnlockClick = (report: MedicalReport) => {
    setSelectedReport(report);
    setIsPaymentOpen(true);
  };

  const handleProcessPayment = async () => {
    const report = selectedReport;
    if (!report || !user) return;

    setIsProcessing(true);

    try {
      // If Razorpay is configured, open real checkout
      if (isRazorpayConfigured()) {
        const response = await openRazorpayCheckout({
          amount: 10, // ₹10
          description: `Unlock report: ${report.testName}`,
          customerName: user.displayName || undefined,
          customerPhone: user.phoneNumber || undefined,
        });

        if (response) {
          // Real payment succeeded
          const updatedUnlocked = [...unlockedReports, report.id];
          setUnlockedReports(updatedUnlocked);
          localStorage.setItem(`unlocked_reports_${user.uid}`, JSON.stringify(updatedUnlocked));
          toast.success("Payment successful! Report unlocked.");
          setViewingResult(report);
          setIsPaymentOpen(false);
        }
      } else {
        // Demo mode — simulate payment after 1.5s
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const updatedUnlocked = [...unlockedReports, report.id];
        setUnlockedReports(updatedUnlocked);
        localStorage.setItem(`unlocked_reports_${user.uid}`, JSON.stringify(updatedUnlocked));
        toast.success("Report unlocked (Demo Mode - no payment was charged).");
        setViewingResult(report);
        setIsPaymentOpen(false);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Payment failed";
      toast.error(message);
    } finally {
      setIsProcessing(false);
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

  if (loadingReports) {
    return (
      <div className="space-y-8">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-white tracking-tight">Medical Reports</h1>
          <p className="text-gray-400 text-sm flex items-center gap-2">
            <svg className="animate-spin h-3.5 w-3.5 text-primary" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
            Fetching records...
          </p>
        </div>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="glass-card p-6 animate-pulse flex gap-5 border-white/5">
              <div className="w-14 h-14 rounded-2xl bg-white/5"></div>
              <div className="flex-1 space-y-3">
                <div className="h-5 bg-white/5 rounded-md w-1/2"></div>
                <div className="h-4 bg-white/5 rounded-md w-1/3"></div>
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
        <h1 className="text-3xl font-bold text-white tracking-tight">Medical Reports</h1>
        <p className="text-gray-400 text-sm">View your test results and diagnostics.</p>
      </motion.div>

      {reports.length === 0 ? (
        <motion.div variants={itemVariants} className="glass-card p-12 text-center border-dashed border-white/10 flex flex-col items-center">
          <div className="w-20 h-20 bg-secondary/50 rounded-full flex items-center justify-center mb-6">
            <FileText className="w-8 h-8 text-gray-500 opacity-50" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">No reports available</h3>
          <p className="text-gray-400 max-w-sm mb-8 text-sm">
            Your medical reports will appear here once you complete booked appointments and clinical tests are processed.
          </p>
          <button 
            onClick={() => navigate("/appointments")}
            className="text-primary hover:text-primary/80 font-medium text-sm transition-colors flex items-center gap-1.5"
          >
            Check your appointments
            <ChevronRight className="w-4 h-4" />
          </button>
        </motion.div>
      ) : (
        <div className="grid gap-5">
          <AnimatePresence>
            {reports.map((report) => {
              const isUnlocked = unlockedReports.includes(report.id);
              return (
                <motion.div 
                  variants={itemVariants}
                  key={report.id} 
                  className={`glass-card p-0 overflow-hidden relative group transition-all duration-300 ${isUnlocked ? 'opacity-90 hover:opacity-100' : 'hover:ring-1 hover:ring-amber-500/20'}`}
                >
                  {/* Left accent */}
                  <div className={`absolute top-0 left-0 w-1 h-full z-10 ${isUnlocked ? 'bg-blue-500' : 'bg-amber-500'}`}></div>

                  <div className="p-5 sm:p-6 flex flex-col sm:flex-row gap-5">
                    {/* Icon */}
                    <div className={`w-14 h-14 shrink-0 rounded-2xl flex items-center justify-center border shadow-inner ${isUnlocked ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
                      <Activity className="w-7 h-7" />
                    </div>
                    
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h3 className="font-bold text-white text-lg">{report.testName}</h3>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                          isUnlocked 
                            ? 'text-blue-400 bg-blue-500/10 border-blue-500/20' 
                            : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        }`}>
                          {isUnlocked ? '🔓 Unlocked' : '🔒 Locked'}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-400 mt-1.5 gap-1.5">
                        <HospitalIcon className="w-3.5 h-3.5" />
                        <span className="truncate">{getHospitalName(report.hospitalId)}</span>
                        <span className="text-gray-600 mx-1">•</span>
                        <span className="text-primary font-medium">{report.date}</span>
                      </div>
                    </div>

                    {/* Action */}
                    <div className="flex items-center shrink-0">
                      {isUnlocked ? (
                        <button 
                          onClick={() => setViewingResult(report)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-black font-semibold text-sm hover:bg-primary hover:text-white transition-all shadow-sm"
                        >
                          View Results <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUnlockClick(report)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 text-black font-semibold text-sm hover:bg-amber-400 transition-all shadow-md shadow-amber-500/20"
                        >
                          <CreditCard className="w-4 h-4" /> Unlock (Demo)
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Payment Modal */}
      <Dialog open={isPaymentOpen} onOpenChange={setIsPaymentOpen}>
        <DialogContent className="sm:max-w-md border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-white">
              <CreditCard className="w-5 h-5 text-primary" /> Payment Required
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Pay a nominal fee of ₹10 to unlock your detailed test results for {selectedReport?.testName}.
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-secondary/30 rounded-2xl my-4 flex flex-col items-center justify-center space-y-4 border border-white/5">
            {!isRazorpayConfigured() && (
              <div className="px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full">
                <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest">Demo Mode</p>
              </div>
            )}
            <div className="text-5xl font-black bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-400">
              ₹10.00
            </div>
            <p className="text-xs text-gray-500 text-center">
              {isRazorpayConfigured()
                ? "Secure payment via Razorpay. UPI, cards, and net banking accepted."
                : "Demo mode. Set VITE_RAZORPAY_KEY_ID to enable real payments."}
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <button 
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-secondary hover:bg-secondary/80 text-gray-300 transition-colors w-full sm:w-auto font-medium"
              onClick={() => setIsPaymentOpen(false)}
              disabled={isProcessing}
            >
               Cancel
            </button>
            <button 
              className="px-5 py-2.5 rounded-xl bg-primary text-background hover:bg-primary/90 transition-all font-semibold flex items-center justify-center gap-2 w-full sm:w-auto shadow-lg shadow-primary/20"
              onClick={handleProcessPayment}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-background/30 border-t-background rounded-full animate-spin" />
                  Unlocking...
                </>
              ) : (
                <>Unlock Report</>
              )}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* View Result Modal */}
      <Dialog open={!!viewingResult} onOpenChange={(open) => !open && setViewingResult(null)}>
        <DialogContent className="sm:max-w-md border-white/10 bg-[#0a0a0a]/95 backdrop-blur-2xl text-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl text-primary">
              <Activity className="w-5 h-5" /> {viewingResult?.testName}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Test done on {viewingResult?.date} at {viewingResult ? getHospitalName(viewingResult.hospitalId) : ""}
            </DialogDescription>
          </DialogHeader>
          
          <div className="p-6 bg-secondary/30 border border-white/5 rounded-2xl my-4">
            <h4 className="font-semibold text-gray-400 mb-3 text-xs tracking-widest uppercase">Clinical Results Summary</h4>
            <p className="text-gray-200 leading-relaxed text-sm">
              {viewingResult?.resultSummary}
            </p>
          </div>

          <DialogFooter>
            <button 
              className="px-5 py-2.5 rounded-xl bg-primary text-background hover:bg-primary/90 transition-all font-semibold w-full shadow-lg shadow-primary/20"
              onClick={() => setViewingResult(null)}
            >
              Close Results
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};

export default ReportsPage;
