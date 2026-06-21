// src/pages/ForgotPassword.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/api";

export default function ForgotPassword() {
    const [email, setEmail] = useState("");
    const [message, setMessage] = useState("");
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage("");
        try {
            const res = await API.post("/auth/forgot-password", { email });
            setMessage(res.data.message || "✅ Password reset instructions sent!");
            setSent(true);
        } catch (err) {
            setMessage(err.response?.data?.message || "❌ Failed to send reset email");
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1 } },
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 15 },
        visible: { opacity: 1, y: 0 },
    };

    return (
        <div className="flex min-h-screen items-center justify-center relative overflow-hidden"
            style={{ background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 30%, #a7f3d0 60%, #6ee7b7 100%)" }}
        >
            {/* Decorative Orbs */}
            <div className="absolute top-[-15%] left-[-8%] w-[400px] h-[400px] bg-gradient-to-br from-emerald-300/30 to-teal-200/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-5%] w-[350px] h-[350px] bg-gradient-to-tl from-lime-200/25 to-green-300/15 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative flex h-auto w-full max-w-4xl flex-row overflow-hidden rounded-3xl shadow-2xl"
                style={{
                    background: "rgba(255, 255, 255, 0.55)",
                    backdropFilter: "blur(20px) saturate(180%)",
                    WebkitBackdropFilter: "blur(20px) saturate(180%)",
                    border: "1px solid rgba(255, 255, 255, 0.4)",
                }}
            >
                {/* Left Panel */}
                <div className="hidden w-1/2 flex-col items-center justify-center p-12 text-center lg:flex relative overflow-hidden"
                    style={{ background: "linear-gradient(160deg, #059669 0%, #047857 40%, #065f46 100%)" }}
                >
                    <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-400/20 rounded-full blur-2xl" />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="flex flex-col items-center relative z-10"
                    >
                        <motion.span
                            className="text-6xl"
                            animate={{ y: [0, -8, 0] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                        >🔑</motion.span>
                        <h1 className="mt-4 text-4xl font-extrabold text-white tracking-tight">Forgot Password?</h1>
                        <p className="mt-3 text-emerald-100/80 leading-relaxed max-w-xs">
                            No worries! We'll send you a link to reset your password and get you back on track.
                        </p>
                    </motion.div>
                </div>

                {/* Right Panel: Form */}
                <div className="w-full lg:w-1/2 p-8 sm:p-12">
                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex flex-col items-center justify-center h-full gap-4 text-center py-8"
                        >
                            <span className="text-6xl">📧</span>
                            <h2 className="text-2xl font-extrabold text-gray-800">Check your inbox!</h2>
                            <p className="text-gray-500 text-sm max-w-xs">
                                We've sent password reset instructions to <strong>{email}</strong>.
                            </p>
                            <Link to="/"
                                className="mt-4 px-6 py-3 rounded-xl font-bold text-white text-sm transition-all"
                                style={{
                                    background: "linear-gradient(135deg, #10b981, #059669)",
                                    boxShadow: "0 4px 14px rgba(16, 185, 129, 0.35)"
                                }}
                            >
                                ← Back to Login
                            </Link>
                        </motion.div>
                    ) : (
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
                                Reset Password
                            </motion.h2>

                            <motion.p variants={itemVariants} className="text-gray-500 text-sm leading-relaxed">
                                Enter your registered email address and we'll send you a link to create a new password.
                            </motion.p>

                            <motion.div variants={itemVariants} className="mt-2">
                                <label className="block text-sm font-semibold text-gray-600 mb-1.5">Email Address</label>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 p-3 text-sm shadow-sm focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 focus:bg-white transition-all outline-none"
                                />
                            </motion.div>

                            {message && (
                                <motion.p
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className={`text-sm px-3 py-2 rounded-lg ${message.startsWith("✅") ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50"}`}
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
                                Send Reset Link →
                            </motion.button>

                            <motion.div variants={itemVariants} className="mt-3 text-center text-sm text-gray-500">
                                <Link to="/" className="font-semibold text-emerald-600 hover:text-emerald-700 hover:underline transition">
                                    ← Back to Login
                                </Link>
                            </motion.div>
                        </motion.form>
                    )}
                </div>
            </motion.div>
        </div>
    );
}