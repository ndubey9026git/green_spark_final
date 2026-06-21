import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import API from "../api/api";

const SparklesIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 animate-pulse text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
  </svg>
);

const UserIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
  </svg>
);

// Typewriter hook to animate AI text response streaming character-by-character
const TypewriterText = ({ text, onComplete }) => {
  const [displayedText, setDisplayedText] = useState("");
  const index = useRef(0);
  const textRef = useRef(text);

  useEffect(() => {
    setDisplayedText("");
    index.current = 0;
    textRef.current = text;

    const interval = setInterval(() => {
      if (index.current < textRef.current.length) {
        setDisplayedText((prev) => prev + textRef.current.charAt(index.current));
        index.current += 1;
      } else {
        clearInterval(interval);
        if (onComplete) onComplete();
      }
    }, 12);

    return () => clearInterval(interval);
  }, [text, onComplete]);

  // Basic markdown formatting helper (handles headers, bold, and lists)
  const formatText = (raw) => {
    return raw.split("\n").map((line, i) => {
      let formatted = line;
      
      // Match headings
      if (formatted.startsWith("### ")) {
        return <h3 key={i} className="text-lg font-bold text-green-800 mt-2 mb-1">{formatted.replace("### ", "")}</h3>;
      }
      if (formatted.startsWith("#### ")) {
        return <h4 key={i} className="text-md font-semibold text-green-700 mt-2 mb-1">{formatted.replace("#### ", "")}</h4>;
      }

      // Match lists
      if (formatted.startsWith("- ") || formatted.match(/^\d+\.\s/)) {
        const isNum = formatted.match(/^\d+\.\s/);
        const prefix = isNum ? isNum[0] : "- ";
        const cleanLine = formatted.replace(prefix, "");
        const boldSplit = cleanLine.split("**");
        const rendered = boldSplit.map((chunk, j) => j % 2 === 1 ? <strong key={j} className="text-green-950 font-bold">{chunk}</strong> : chunk);
        return (
          <div key={i} className="flex items-start gap-2 ml-2 my-1 text-sm text-gray-700">
            <span className="text-green-500 font-bold">{prefix}</span>
            <span>{rendered}</span>
          </div>
        );
      }

      // Match bold tags
      const boldSplit = formatted.split("**");
      if (boldSplit.length > 1) {
        formatted = boldSplit.map((chunk, j) => j % 2 === 1 ? <strong key={j} className="text-green-950 font-bold">{chunk}</strong> : chunk);
      }

      return <p key={i} className="my-1.5 text-sm text-gray-700 leading-relaxed">{formatted}</p>;
    });
  };

  return <div>{formatText(displayedText)}</div>;
};

export default function AIEcoAdvisor({ isOpen, onToggle }) {
  const [history, setHistory] = useState([
    {
      from: "bot",
      text: "Hi! I am your AI Eco-Advisor. 🌿\n\nI can analyze your carbon footprint and generate custom challenges to help you earn points and lower your emissions. Try clicking a shortcut button below or type your question!",
      isNew: false
    }
  ]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history, loading]);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSend = async (msgText) => {
    if (!msgText.trim()) return;

    // Add user message to history
    setHistory((h) => [...h, { from: "me", text: msgText }]);
    setDraft("");
    setLoading(true);

    try {
      const res = await API.post("/ai/chat", { message: msgText });
      
      setHistory((h) => [
        ...h,
        {
          from: "bot",
          text: res.data.message,
          attachment: res.data.attachment,
          isNew: true
        }
      ]);
    } catch (err) {
      console.error(err);
      setHistory((h) => [
        ...h,
        {
          from: "bot",
          text: "I am having trouble connecting to my central green processor. Please verify your connection and try again.",
          isNew: true
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptChallenge = async (challengeData) => {
    try {
      await API.post("/ai/accept-challenge", challengeData);
      showToast(`🎉 Challenge "${challengeData.title}" added to your dashboard!`);
      // Update challenges list locally on dashboard by emitting a custom event
      window.dispatchEvent(new Event("challengeAccepted"));
    } catch (err) {
      console.error(err);
      showToast("❌ Failed to accept challenge.");
    }
  };

  const handleTriviaAnswer = (selectedOpt, correctOpt, explanation) => {
    const isCorrect = selectedOpt === correctOpt;
    setHistory((h) => [
      ...h,
      {
        from: "bot",
        text: isCorrect
          ? `🎉 **CORRECT!** Amazing job.\n\n${explanation}`
          : `❌ **INCORRECT.** The correct answer was **${correctOpt}**.\n\n${explanation}`,
        isNew: true
      }
    ]);
  };

  const PRESET_CHIPS = [
    { label: "🧠 Analyze Footprint", prompt: "Analyze my carbon footprint" },
    { label: "🎯 Custom Challenge", prompt: "Generate a custom challenge" },
    { label: "❓ Climate Trivia", prompt: "Start a climate trivia quiz" },
    { label: "⚡ Save Energy", prompt: "How do I save energy at home?" }
  ];

  return (
    <>
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: "-50%" }}
            animate={{ opacity: 1, y: 0, x: "-50%" }}
            exit={{ opacity: 0, y: 20, x: "-50%" }}
            className="fixed bottom-28 left-1/2 bg-gray-900/90 backdrop-blur-md text-white border border-green-500/30 px-5 py-3 rounded-2xl shadow-2xl z-[9999] text-sm font-semibold flex items-center gap-2"
          >
            🌿 {toast}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-16 h-16 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 text-white flex items-center justify-center shadow-[0_8px_30px_rgb(16,185,129,0.4)] border border-emerald-400/40 z-50 focus:outline-none"
        whileHover={{ scale: 1.08, rotate: 5 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="text-3xl font-sans">{isOpen ? "✕" : "💬"}</span>
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-ping" />
        )}
      </motion.button>

      {/* Expandable Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.9 }}
            className="fixed bottom-24 right-6 w-96 max-w-[calc(100vw-2rem)] h-[600px] max-h-[calc(100vh-10rem)] bg-white/70 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] z-50 flex flex-col overflow-hidden"
          >
            {/* Ambient background glow orb inside glass card */}
            <div className="absolute -top-10 -left-10 w-40 h-40 rounded-full bg-green-300/30 blur-2xl pointer-events-none" />
            <div className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full bg-emerald-400/20 blur-2xl pointer-events-none" />

            {/* Chat Header */}
            <div className="p-4 border-b border-white/20 bg-gradient-to-r from-green-600/90 to-emerald-700/90 text-white flex items-center gap-3 relative z-10">
              <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center border border-white/20 shadow-inner">
                <SparklesIcon />
              </div>
              <div>
                <h3 className="font-bold text-sm leading-tight">AI Eco-Advisor</h3>
                <p className="text-[10px] text-green-100 flex items-center gap-1 font-medium">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping inline-block" />
                  Context-Aware Assistant
                </p>
              </div>
            </div>

            {/* Chat Bubble Area */}
            <div className="flex-1 p-4 space-y-4 overflow-y-auto relative z-10 scrollbar-thin">
              {history.map((msg, i) => (
                <div key={i} className={`flex ${msg.from === "bot" ? "justify-start" : "justify-end"} w-full items-start gap-2`}>
                  {msg.from === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center shadow-md flex-shrink-0 text-white text-xs border border-white/30">
                      🌿
                    </div>
                  )}

                  <div className="flex flex-col gap-1.5 max-w-[80%]">
                    <div
                      className={`p-3 rounded-2xl shadow-sm text-sm border ${
                        msg.from === "bot"
                          ? "bg-white/90 border-green-100/50 text-gray-800 rounded-tl-sm"
                          : "bg-gradient-to-tr from-green-600 to-emerald-700 border-green-600 text-white rounded-tr-sm"
                      }`}
                    >
                      {msg.from === "bot" && msg.isNew ? (
                        <TypewriterText
                          text={msg.text}
                          onComplete={() => {
                            // Turn off dynamic typing flag after finish
                            setHistory((prev) =>
                              prev.map((item, idx) => (idx === i ? { ...item, isNew: false } : item))
                            );
                          }}
                        />
                      ) : (
                        msg.text.split("\n").map((line, lineIdx) => {
                          if (line.startsWith("### ")) {
                            return <h3 key={lineIdx} className="text-md font-bold text-green-800 mt-2 mb-1">{line.replace("### ", "")}</h3>;
                          }
                          if (line.startsWith("#### ")) {
                            return <h4 key={lineIdx} className="text-sm font-semibold text-green-700 mt-1 mb-1">{line.replace("#### ", "")}</h4>;
                          }
                          return <p key={lineIdx} className="my-1.5 text-xs md:text-sm leading-relaxed">{line}</p>;
                        })
                      )}
                    </div>

                    {/* Renders Custom Action Cards Embedded in Bot Responses */}
                    {!msg.isNew && msg.attachment && msg.attachment.type === "challenge" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-green-50/90 border border-green-200 p-3 rounded-2xl flex flex-col gap-2 mt-1.5 shadow-sm"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-2xl">{msg.attachment.data.icon}</span>
                          <span className="font-bold text-xs text-green-900">{msg.attachment.data.title}</span>
                        </div>
                        <p className="text-xs text-green-800 leading-tight">{msg.attachment.data.description}</p>
                        <button
                          onClick={() => handleAcceptChallenge(msg.attachment.data)}
                          className="w-full py-1.5 bg-green-600 hover:bg-green-700 text-white text-xs font-semibold rounded-xl shadow-md transition"
                        >
                          Accept AI Challenge (+{msg.attachment.data.points} pts)
                        </button>
                      </motion.div>
                    )}

                    {!msg.isNew && msg.attachment && msg.attachment.type === "trivia" && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-indigo-50/95 border border-indigo-200 p-3 rounded-2xl flex flex-col gap-2 mt-1.5 shadow-sm"
                      >
                        <p className="text-xs font-semibold text-indigo-900 mb-1">Pick your answer:</p>
                        <div className="flex flex-col gap-1.5">
                          {msg.attachment.data.options.map((opt) => (
                            <button
                              key={opt}
                              onClick={() =>
                                handleTriviaAnswer(
                                  opt,
                                  msg.attachment.data.correct,
                                  msg.attachment.data.explanation
                                )
                              }
                              className="w-full text-left px-3 py-1.5 bg-white hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs text-gray-700 transition"
                            >
                              {opt}
                            </button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>

                  {msg.from === "me" && (
                    <div className="w-8 h-8 rounded-full bg-indigo-100 border border-indigo-200 flex items-center justify-center flex-shrink-0">
                      <UserIcon />
                    </div>
                  )}
                </div>
              ))}

              {/* Bot Loading Bubble */}
              {loading && (
                <div className="flex justify-start w-full items-start gap-2">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-green-500 to-emerald-600 flex items-center justify-center text-white text-xs">
                    🌿
                  </div>
                  <div className="bg-white/80 border border-green-50/50 p-3.5 rounded-2xl rounded-tl-sm flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-bounce" />
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Chips */}
            <div className="px-4 py-2 bg-white/40 border-t border-white/20 flex gap-1.5 overflow-x-auto whitespace-nowrap scrollbar-none relative z-10">
              {PRESET_CHIPS.map((chip) => (
                <button
                  key={chip.label}
                  onClick={() => handleSend(chip.prompt)}
                  className="px-3 py-1 bg-white hover:bg-green-50 text-green-700 hover:text-green-800 border border-green-100 rounded-full text-xs font-semibold shadow-sm transition"
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-3 bg-white/90 border-t border-white/20 flex gap-2 relative z-10 items-center">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleSend(draft);
                }}
                placeholder="Ask me anything about carbon reduction..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/50"
              />
              <button
                onClick={() => handleSend(draft)}
                className="px-4 py-2 bg-gradient-to-tr from-green-500 to-emerald-600 text-white font-bold rounded-2xl text-sm shadow-md hover:from-green-600 hover:to-emerald-700 transition"
              >
                Send
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
