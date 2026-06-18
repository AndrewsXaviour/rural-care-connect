import { useState, useRef, useEffect } from "react";
import { MessageCircle, X, Send, Bot, User, Loader2 } from "lucide-react";
import { sendMessageToGemini, ChatMessage } from "@/lib/gemini";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export const Assistant = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: "model", text: "Namaste! I am Asha, your RuralCare AI assistant. How can I help with your health today?" }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message to history
    const updatedMessages = [...messages, { role: "user", text: userMessage } as ChatMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      // Send message to Gemini
      const aiResponse = await sendMessageToGemini(updatedMessages);
      setMessages([...updatedMessages, { role: "model", text: aiResponse }]);
    } catch (error: unknown) {
      console.error("Gemini Error:", error);
      toast.error("I'm having trouble connecting right now. Please check your API key in the .env file.");
      setMessages([...updatedMessages, { role: "model", text: "I apologize, but I am facing a technical issue. Please try again in a few moments." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-[101] flex flex-col items-end">
      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            key="chat-window"
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="w-[350px] sm:w-[400px] h-[520px] bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 shadow-2xl shadow-black/50 rounded-2xl flex flex-col overflow-hidden mb-4"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-primary/20 to-blue-500/20 p-4 flex items-center justify-between border-b border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent"></div>
              <div className="flex items-center gap-3 relative z-10">
                <div className="w-11 h-11 rounded-xl bg-primary/20 border border-primary/30 flex items-center justify-center shadow-inner">
                  <Bot className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-sm tracking-tight">Asha Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></div>
                    <p className="text-[10px] text-gray-400 uppercase tracking-widest font-semibold">Online • AI Health Guide</p>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors relative z-10"
              >
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/10"
            >
              {messages.map((msg, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: 0.05 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div className={`flex gap-2.5 max-w-[85%] ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs ${
                      msg.role === "user" 
                        ? "bg-primary/20 text-primary border border-primary/30" 
                        : "bg-secondary border border-white/5 text-gray-400"
                    }`}>
                      {msg.role === "user" ? <User className="w-3.5 h-3.5" /> : <Bot className="w-3.5 h-3.5" />}
                    </div>
                    <div className={`px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      msg.role === "user" 
                        ? "bg-primary text-background rounded-tr-md font-medium" 
                        : "bg-secondary border border-white/5 text-gray-200 rounded-tl-md"
                    }`}>
                      {msg.text}
                    </div>
                  </div>
                </motion.div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2.5 max-w-[85%]">
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-secondary border border-white/5">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl rounded-tl-md bg-secondary border border-white/5">
                      <div className="flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-white/5 bg-secondary/30">
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Type your health question..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  className="flex-1 px-4 py-2.5 text-sm bg-secondary border border-white/5 text-white placeholder:text-gray-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-primary/50 focus:border-primary/30 transition-all"
                />
                <button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  className="w-10 h-10 rounded-xl bg-primary text-background flex items-center justify-center hover:bg-primary/90 transition-all shadow-md shadow-primary/20 disabled:opacity-30 disabled:cursor-not-allowed disabled:shadow-none group"
                >
                  <Send className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </button>
              </div>
              <p className="text-[10px] text-gray-600 text-center mt-3">
                I am an AI. Not a replacement for a doctor.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            key="chatbot-btn"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 rounded-2xl bg-primary text-background shadow-xl shadow-primary/30 flex items-center justify-center hover:shadow-primary/50 transition-all hover:scale-105 active:scale-95 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl"></div>
            <MessageCircle className="w-6 h-6 group-hover:rotate-6 transition-transform relative z-10" />
            <span className="absolute -top-0.5 -right-0.5 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border border-background"></span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
