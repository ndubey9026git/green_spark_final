// src/pages/Login.jsx

import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import API from "../api/api";

// A simple SVG Leaf for the branding panel
const LeafIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-16 w-16 text-green-600"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={1}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
    />
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15.536 8.464a5 5 0 00-7.072 0"
    />
  </svg>
);

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const navigate = useNavigate();

  // ✅ UPDATED: handleSubmit now checks the user's role
  // src/pages/Login.jsx

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
  // Framer Motion variants for the container
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.1,
        when: "beforeChildren",
        staggerChildren: 0.1,
      },
    },
  };

  // Variants for child elements
  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-green-50">
      <div className="relative flex h-auto w-full max-w-4xl flex-row overflow-hidden rounded-2xl bg-white shadow-2xl">
        
        {/* Left Panel: Branding & Illustration */}
        <div className="hidden w-11/12 flex-col items-center justify-center bg-gradient-to-br from-lime-200 to-green-300 p-12 text-center text-white lg:flex">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="flex flex-col items-center"
          >
            <LeafIcon />
            <h1 className="mt-4 text-4xl font-bold text-green-800">
              GreenSpark
            </h1>
            <p className="mt-2 text-green-700">
              Igniting a sustainable future, one action at a time.
            </p>
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
            <motion.h2 variants={itemVariants} className="text-3xl font-bold text-gray-800">
              Welcome Back
            </motion.h2>
            
            <motion.p variants={itemVariants} className="text-gray-500">
              Please login to your account.
            </motion.p>
            
            <motion.div variants={itemVariants} className="mt-4">
              <label className="block text-sm font-medium text-gray-600">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 p-3 shadow-sm focus:border-green-500 focus:ring focus:ring-green-500 focus:ring-opacity-50"
              />
            </motion.div>
            
            <motion.div variants={itemVariants}>
              <label className="block text-sm font-medium text-gray-600">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 block w-full rounded-lg border-gray-300 p-3 shadow-sm focus:border-green-500 focus:ring focus:ring-green-500 focus:ring-opacity-50"
              />
            </motion.div>
            
            {message && (
              <motion.p
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-sm text-red-600"
              >
                {message}
              </motion.p>
            )}

            <motion.button
              variants={itemVariants}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="mt-4 w-full rounded-lg bg-green-600 p-3 text-lg font-semibold text-white shadow-md transition hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            >
              Login
            </motion.button>
            
            <motion.div variants={itemVariants} className="mt-4 text-center text-sm text-gray-600">
              <p>
                Don't have an account?{" "}
                <Link to="/register" className="font-medium text-green-600 hover:underline">
                  Sign up
                </Link>
              </p>
              <p className="mt-2">
                <Link to="/forgot-password" className="font-medium text-green-600 hover:underline">
                  Forgot Password?
                </Link>
              </p>
            </motion.div>
          </motion.form>
        </div>
      </div>
    </div>
  );
}