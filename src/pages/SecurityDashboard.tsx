import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Shield, ShieldAlert, ShieldX, ShieldCheck, Zap, Activity, DollarSign, Lock, RefreshCw, Play } from "lucide-react";
import { fetchGuardTelemetry, GuardTelemetry, DEMO_PAYLOADS } from "@/lib/guardClient";
import { sendMessageToGemini } from "@/lib/gemini";

const CircuitStateDisplay = ({ state, openedAt, cooldownMs }: { state: string; openedAt: number | null; cooldownMs: number }) => {
  const [remaining, setRemaining] = useState(0);

  useEffect(() => {
    if (state !== "OPEN" || !openedAt) return;
    const interval = setInterval(() => {
      const elapsed = Date.now() - openedAt;
      const left = Math.max(0, cooldownMs - elapsed);
      setRemaining(Math.ceil(left / 1000));
    }, 500);
    return () => clearInterval(interval);
  }, [state, openedAt, cooldownMs]);

  const configs = {
    CLOSED: {
      icon: ShieldCheck,
      label: "CLOSED",
      subtitle: "Normal Operation — All traffic flowing safely",
      glow: "shadow-emerald-500/30",
      border: "border-emerald-500/30",
      bg: "bg-emerald-500/10",
      text: "text-emerald-400",
      dot: "bg-emerald-400",
    },
    HALF_OPEN: {
      icon: ShieldAlert,
      label: "HALF-OPEN",
      subtitle: "Warning — Elevated threat level detected",
      glow: "shadow-amber-500/30",
      border: "border-amber-500/30",
      bg: "bg-amber-500/10",
      text: "text-amber-400",
      dot: "bg-amber-400",
    },
    OPEN: {
      icon: ShieldX,
      label: "OPEN (TRIPPED)",
      subtitle: `Circuit Tripped — All LLM calls suspended${remaining > 0 ? ` • Resets in ${remaining}s` : ""}`,
      glow: "shadow-red-500/30",
      border: "border-red-500/30",
      bg: "bg-red-500/10",
      text: "text-red-400",
      dot: "bg-red-400",
    },
  };
  const cfg = configs[state as keyof typeof configs] ?? configs.CLOSED;
  const Icon = cfg.icon;

  return (
    <div className={`glass-card p-6 border ${cfg.border} shadow-lg ${cfg.glow} relative overflow-hidden`}>
      <div className={`absolute inset-0 ${cfg.bg} opacity-30`} />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">Circuit Breaker Status</p>
          <div className={`flex items-center gap-1.5`}>
            <span className={`w-2 h-2 rounded-full ${cfg.dot} ${state !== "OPEN" ? "animate-pulse" : ""}`} />
            <span className={`text-xs font-bold ${cfg.text}`}>{cfg.label}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className={`w-16 h-16 rounded-2xl ${cfg.bg} border ${cfg.border} flex items-center justify-center`}>
            <Icon className={`w-8 h-8 ${cfg.text}`} />
          </div>
          <div>
            <p className={`text-2xl font-bold ${cfg.text}`}>{cfg.label}</p>
            <p className="text-sm text-gray-400 mt-0.5">{cfg.subtitle}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: React.ElementType; label: string; value: string | number; sub?: string; color: string }) => (
  <div className="glass-card p-5">
    <div className="flex items-center gap-3 mb-3">
      <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
        <Icon className="w-4 h-4" />
      </div>
      <p className="text-xs text-gray-400 uppercase tracking-widest font-semibold">{label}</p>
    </div>
    <p className="text-3xl font-bold text-white">{value}</p>
    {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
  </div>
);

const SeverityBadge = ({ severity }: { severity: string }) => {
  const map: Record<string, string> = {
    CRITICAL: "bg-red-500/20 text-red-400 border-red-500/30",
    HIGH: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    LOW: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    NONE: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  };
  return (
    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${map[severity] ?? map.NONE}`}>
      {severity}
    </span>
  );
};

const ActionBadge = ({ action }: { action: string }) => {
  const map: Record<string, string> = {
    BLOCKED: "bg-red-500/20 text-red-300",
    CIRCUIT_TRIPPED: "bg-red-900/40 text-red-300",
    SANITIZED: "bg-amber-500/20 text-amber-300",
    ALLOWED: "bg-emerald-500/20 text-emerald-300",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${map[action] ?? ""}`}>
      {action.replace("_", " ")}
    </span>
  );
};

const SecurityDashboard = () => {
  const [telemetry, setTelemetry] = useState<GuardTelemetry | null>(null);
  const [loading, setLoading] = useState(true);
  const [runningDemo, setRunningDemo] = useState<string | null>(null);
  const [demoResult, setDemoResult] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchGuardTelemetry();
      setTelemetry(data);
    } catch {
      // Silently fail on telemetry fetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [refresh]);

  const runDemo = async (key: keyof typeof DEMO_PAYLOADS) => {
    setRunningDemo(key);
    setDemoResult(null);
    try {
      const result = await sendMessageToGemini([{ role: "user", text: DEMO_PAYLOADS[key] }]);
      setDemoResult(result.guardBlocked
        ? `🚨 BLOCKED [${result.attackCategory}] — ${result.text.slice(0, 120)}...`
        : `✅ ALLOWED — ${result.text.slice(0, 120)}...`
      );
      await refresh();
    } catch {
      setDemoResult("⚠️ Error during demo");
    } finally {
      setRunningDemo(null);
    }
  };

  const containerVariants = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.07 } } };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } };

  const demoCards: Record<string, { label: string; desc: string; color: string }> = {
    normal: { label: "✅ Normal Query (Tamil)", desc: "Safe health question — should pass all guards", color: "border-emerald-500/30 hover:border-emerald-400/50 hover:bg-emerald-500/5" },
    instructionOverride: { label: "🔴 Instruction Override", desc: "Attempts to override system instructions", color: "border-red-500/30 hover:border-red-400/50 hover:bg-red-500/5" },
    jailbreak: { label: "🔴 DAN Jailbreak Persona", desc: "Attempts DAN / evil persona injection", color: "border-red-500/30 hover:border-red-400/50 hover:bg-red-500/5" },
    systemExtraction: { label: "🟠 System Prompt Extraction", desc: "Attempts to read internal system instructions", color: "border-orange-500/30 hover:border-orange-400/50 hover:bg-orange-500/5" },
    medicalToxicity: { label: "🔴 Medical Toxicity Bypass", desc: "Roleplay framing for harmful medical info", color: "border-red-500/30 hover:border-red-400/50 hover:bg-red-500/5" },
    doWBurst: { label: "🔴 Denial-of-Wallet Burst", desc: "Mass injection override attempt", color: "border-red-500/30 hover:border-red-400/50 hover:bg-red-500/5" },
  };

  return (
    <motion.div className="space-y-6" variants={containerVariants} initial="hidden" animate="show">
      {/* Header */}
      <motion.div variants={itemVariants} className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            LLM Guard Dashboard
          </h1>
          <p className="text-gray-400 mt-1">Real-time AI security telemetry & circuit breaker control</p>
        </div>
        <button onClick={refresh} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary border border-white/5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-all">
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </motion.div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Circuit Breaker Status */}
          <motion.div variants={itemVariants}>
            <CircuitStateDisplay
              state={telemetry?.circuitState ?? "CLOSED"}
              openedAt={telemetry?.circuitOpenedAt ?? null}
              cooldownMs={telemetry?.cooldownMs ?? 60000}
            />
          </motion.div>

          {/* Stats Grid */}
          <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Activity} label="Total Scanned" value={telemetry?.totalScanned ?? 0} sub="prompts inspected" color="bg-blue-500/10 text-blue-400" />
            <StatCard icon={ShieldX} label="Attacks Blocked" value={telemetry?.totalBlocked ?? 0} sub="injection attempts stopped" color="bg-red-500/10 text-red-400" />
            <StatCard icon={Zap} label="Tokens Saved" value={(telemetry?.estimatedTokensSaved ?? 0).toLocaleString()} sub="via circuit breaking" color="bg-purple-500/10 text-purple-400" />
            <StatCard icon={DollarSign} label="Cost Saved" value={`$${(telemetry?.estimatedCostSavedUSD ?? 0).toFixed(4)}`} sub="API cost averted" color="bg-emerald-500/10 text-emerald-400" />
          </motion.div>

          {/* Attack Simulator */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Lock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Live Attack Simulator</h2>
              <span className="text-xs text-gray-500 ml-2">— Click to demo each attack vector</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(demoCards).map(([key, { label, desc, color }]) => (
                <button
                  key={key}
                  onClick={() => runDemo(key as keyof typeof DEMO_PAYLOADS)}
                  disabled={runningDemo !== null}
                  className={`p-3 rounded-xl border bg-secondary/40 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${color}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{label}</span>
                    {runningDemo === key ? (
                      <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Play className="w-3 h-3 text-gray-500" />
                    )}
                  </div>
                  <p className="text-[10px] text-gray-500">{desc}</p>
                </button>
              ))}
            </div>
            {demoResult && (
              <div className="mt-4 p-3 rounded-xl bg-secondary border border-white/5">
                <p className="text-xs font-mono text-gray-300 leading-relaxed">{demoResult}</p>
              </div>
            )}
          </motion.div>

          {/* Attack Log */}
          <motion.div variants={itemVariants} className="glass-card p-6">
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Recent Attack Log</h2>
              <span className="text-xs text-gray-500 ml-2">— Last 10 events</span>
            </div>
            {!telemetry?.recentAttacks?.length ? (
              <div className="flex flex-col items-center justify-center py-12 text-gray-600">
                <ShieldCheck className="w-12 h-12 mb-3 opacity-30" />
                <p className="text-sm">No attacks recorded yet</p>
                <p className="text-xs mt-1 opacity-60">Use the Attack Simulator above to trigger events</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-gray-500 uppercase tracking-widest border-b border-white/5">
                      <th className="text-left pb-2 pr-4">Time</th>
                      <th className="text-left pb-2 pr-4">Attack Vector</th>
                      <th className="text-left pb-2 pr-4">Severity</th>
                      <th className="text-left pb-2 pr-4">Action</th>
                      <th className="text-left pb-2">Prompt Snippet</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {telemetry.recentAttacks.map((entry) => (
                      <tr key={entry.id} className="hover:bg-white/2 transition-colors">
                        <td className="py-2 pr-4 text-gray-500 font-mono whitespace-nowrap">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </td>
                        <td className="py-2 pr-4 text-gray-300 whitespace-nowrap">
                          {entry.attackCategory.replace(/_/g, " ")}
                        </td>
                        <td className="py-2 pr-4">
                          <SeverityBadge severity={entry.severity} />
                        </td>
                        <td className="py-2 pr-4">
                          <ActionBadge action={entry.action} />
                        </td>
                        <td className="py-2 text-gray-500 font-mono truncate max-w-[200px]">
                          {entry.promptSnippet}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default SecurityDashboard;
