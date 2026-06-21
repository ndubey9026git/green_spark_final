// src/pages/Register.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/api";

export default function Register() {
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [message, setMessage] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            await API.post("/auth/register", { name, email, password }); // Role is no longer sent
            setMessage("✅ Account created! Redirecting to login...");
            setTimeout(() => navigate("/"), 1500);
        } catch (err) {
            setMessage(err.response?.data?.message || "❌ Registration failed");
        }
    };

    const containerVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } } };
    const itemVariants = { hidden: { opacity: 0, y: 15 }, visible: { opacity: 1, y: 0 } };

    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #e8f6ef 0%, #d0edda 34%, #b0e1c3 68%, #8fc78f 100%)" }}
        >
            {/* Decorative Gradient Orbs */}
            <div className="absolute top-[-15%] right-[-8%] w-[450px] h-[450px] bg-gradient-to-br from-teal-300/30 to-emerald-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-gradient-to-tl from-lime-200/25 to-green-300/15 rounded-full blur-3xl pointer-events-none" />

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
                <div className="hidden w-1/2 flex-col items-center justify-center p-12 text-center lg:flex relative overflow-hidden"
                    style={{ background: "linear-gradient(160deg, #083d29 0%, #0f5132 38%, #134f36 100%)" }}
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center relative z-10"
                    >
                        <motion.span className="text-6xl"
                            animate={{ rotate: [0, 5, -5, 0] }}
                            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        >🌍</motion.span>
                        <h1 className="mt-4 text-4xl font-extrabold text-white tracking-tight">Join GreenSpark</h1>
                        <p className="mt-3 text-emerald-100/80 leading-relaxed max-w-xs">
                            Start your journey towards a sustainable, greener planet today.
                        </p>
                    </motion.div>
                </div>
                <div className="w-full lg:w-1/2 p-8 sm:p-12">
                    <motion.form onSubmit={handleSubmit} className="flex flex-col gap-4" variants={containerVariants} initial="hidden" animate="visible">
                        <motion.div variants={itemVariants} className="flex items-center gap-2 lg:hidden mb-2">
                            <span className="text-3xl">🌍</span>
                            <span className="text-2xl font-extrabold text-emerald-700">GreenSpark</span>
                        </motion.div>
                        <motion.h2 variants={itemVariants} className="text-3xl font-extrabold text-gray-800">Create an Account</motion.h2>
                        <motion.div variants={itemVariants} className="mt-2">
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Full Name</label>
                            <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="John Doe"
                                className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none" />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email</label>
                            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="you@example.com"
                                className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none" />
                        </motion.div>
                        <motion.div variants={itemVariants}>
                            <label className="block text-sm font-semibold text-gray-600 mb-1.5">Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required placeholder="••••••••"
                                className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none" />
                        </motion.div>

                        {/* ✅ ROLE DROPDOWN HAS BEEN REMOVED */}

                        {message && (
                            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                className={`text-sm px-3 py-2 rounded-lg ${message.startsWith("✅") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
                            >{message}</motion.p>
                        )}

                        <motion.button type="submit" whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} variants={itemVariants}
                            className="mt-2 w-full rounded-xl p-3.5 text-base font-bold text-white shadow-lg transition-all outline-none"
                            style={{
                                background: "linear-gradient(135deg, #10b981 0%, #059669 50%, #047857 100%)",
                                boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)",
                            }}
                        >Create Account →</motion.button>
                        <motion.div variants={itemVariants} className="mt-3 text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <Link to="/" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition">
                                Sign in
                            </Link>
                        </motion.div>
                    </motion.form>
                </div>
            </motion.div>
        </div>
    );
}