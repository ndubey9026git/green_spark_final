// src/pages/Login.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/api";

// Animated floating eco particles
const FloatingParticle = ({ emoji, delay, x, duration }) => (
  <motion.span
    className="absolute text-2xl select-none pointer-events-none"
    style={{ left: `${x}%`, bottom: "-10%" }}
    animate={{ y: [0, -500, -600], opacity: [0, 1, 0], rotate: [0, 15, -10] }}
    transition={{ duration, delay, repeat: Infinity, ease: "easeInOut" }}
  >
    {emoji}
  </motion.span>
);

const PARTICLES = [
  { emoji: "🌿", delay: 0, x: 12, duration: 8 },
  { emoji: "🌱", delay: 1.5, x: 30, duration: 9 },
  { emoji: "🍃", delay: 3, x: 55, duration: 7 },
  { emoji: "🌍", delay: 0.8, x: 78, duration: 10 },
  { emoji: "☘️", delay: 4, x: 88, duration: 8 },
  { emoji: "💧", delay: 2, x: 42, duration: 11 },
  { emoji: "🌻", delay: 5, x: 65, duration: 9 },
];

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      const res = await API.post("/auth/login", { email, password });
      
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("role", res.data.role);
      localStorage.setItem("isLoggedIn", "true");

      // ✅ UPDATED: Now checks for admin, then teacher, then defaults to dashboard
      if (res.data.role === 'admin') {
        navigate("/admin-panel");
      } else if (res.data.role === 'teacher') {
        navigate("/teacher-panel");
      } else {
        navigate("/dashboard");
      }

    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Login failed");
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1, y: 0,
      transition: { delay: 0.1, when: "beforeChildren", staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #e8f6ef 0%, #d0edda 34%, #b0e1c3 68%, #8fc78f 100%)" }}
    >
      {/* Floating Particles */}
      {PARTICLES.map((p, i) => <FloatingParticle key={i} {...p} />)}

      {/* Decorative Gradient Orbs */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-gradient-to-br from-emerald-300/40 to-teal-200/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-15%] right-[-5%] w-[400px] h-[400px] bg-gradient-to-tl from-lime-200/30 to-green-300/20 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative flex h-auto w-full max-w-4xl flex-row overflow-hidden rounded-3xl shadow-2xl"
        style={{
          background: "rgba(255, 255, 255, 0.82)",
          backdropFilter: "blur(22px) saturate(190%)",
          WebkitBackdropFilter: "blur(22px) saturate(190%)",
          border: "1px solid rgba(255, 255, 255, 0.55)",
        }}
      >
        
        {/* Left Panel: Branding & Illustration */}
        <div className="hidden w-1/2 flex-col items-center justify-center p-12 text-center lg:flex relative overflow-hidden"
          style={{ background: "linear-gradient(160deg, #083d29 0%, #0f5132 38%, #134f36 100%)" }}
        >
          {/* Inner glow */}
          <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-400/20 rounded-full blur-2xl" />
          <div className="absolute bottom-10 left-5 w-32 h-32 bg-teal-300/15 rounded-full blur-xl" />

          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center relative z-10"
          >
            <motion.span
              className="text-6xl"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              🌿
            </motion.span>
            <h1 className="mt-4 text-4xl font-extrabold text-white tracking-tight">
              GreenSpark
            </h1>
            <p className="mt-3 text-emerald-100/80 leading-relaxed max-w-xs">
              Igniting a sustainable future through climate engineering, one action at a time.
            </p>
            <div className="mt-6 flex gap-3">
              {["⚡", "🧬", "💨", "🌍"].map((e, i) => (
                <motion.span
                  key={i}
                  className="text-2xl"
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2, delay: i * 0.3, repeat: Infinity }}
                >
                  {e}
                </motion.span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right Panel: Login Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12">
          <motion.form
            onSubmit={handleSubmit}
            className="flex flex-col gap-4"
            variants={containerVariants}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={itemVariants} className="flex items-center gap-2 lg:hidden mb-2">
              <span className="text-3xl">🌿</span>
              <span className="text-2xl font-extrabold text-emerald-700">GreenSpark</span>
            </motion.div>

            <motion.h2 variants={itemVariants} className="text-3xl font-extrabold text-gray-800">
              Welcome Back
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-gray-500">
              Sign in to your sustainability dashboard.
            </motion.p>
            
            <motion.div variants={itemVariants} className="mt-2">
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
              />
            </motion.div>
            
            {message && (
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg"
              >
                {message}
              </motion.p>
            )}

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="mt-2 w-full rounded-xl p-3.5 text-base font-bold text-white shadow-lg transition-all outline-none"
              style={{
                background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
              }}
            >
              Sign In →
            </motion.button>
            
            <motion.div variants={itemVariants} className="mt-3 text-center text-sm text-gray-500 space-y-2">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition">
                  Create one free
                </Link>
              </p>
              <p>
                <Link to="/forgot-password" className="font-medium text-gray-400 hover:text-emerald-600 transition">
                  Forgot your password?
                </Link>
              </p>
            </motion.div>
          </motion.form>
        </div>
      </motion.div>
    </div>
  );
}