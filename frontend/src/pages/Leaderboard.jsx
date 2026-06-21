// src/pages/Leaderboard.jsx

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import API from "../api/api";
import { motion } from "framer-motion";

// Medal icons for top 3
const MEDALS = ["🥇", "🥈", "🥉"];

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true);
        const res = await API.get("/leaderboard");
        setLeaders(res.data);
      } catch (err) {
        setError("Could not fetch leaderboard data.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { opacity: 1, x: 0 },
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5, #a7f3d0)" }}>
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center">
          <motion.span className="text-5xl block mb-4" animate={{ rotate: [0, 360] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>🏆</motion.span>
          <p className="text-emerald-700 font-semibold">Loading Leaderboard...</p>
        </motion.div>
      </div>
    );
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  // Top 3 for podium
  const top3 = leaders.slice(0, 3);
  const rest = leaders.slice(3);

  return (
    <div className="min-h-screen p-4 sm:p-8" style={{ background: "linear-gradient(135deg, #ecfdf5, #d1fae5, #a7f3d0)" }}>
      <motion.div
        className="max-w-4xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-extrabold text-emerald-800 flex items-center gap-3">
              <span className="text-5xl">🏆</span> Leaderboard
            </h1>
            <p className="text-sm text-emerald-600/70 mt-1">Top sustainability champions</p>
          </div>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 font-semibold text-sm rounded-xl shadow-md transition-all hover:shadow-lg"
            style={{
              background: "rgba(255,255,255,0.6)",
              backdropFilter: "blur(12px)",
              border: "1px solid rgba(255,255,255,0.4)",
            }}
          >
            ← Dashboard
          </Link>
        </div>

        {/* Podium for Top 3 */}
        {top3.length >= 3 && (
          <div className="flex items-end justify-center gap-4 mb-10">
            {/* 2nd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex flex-col items-center"
            >
              <img
                src={top3[1].avatar || `https://api.dicebear.com/8.x/micah/svg?seed=${top3[1].name}`}
                alt={top3[1].name}
                className="w-14 h-14 rounded-full border-3 border-gray-300 bg-gray-100 mb-2"
              />
              <p className="text-xs font-bold text-slate-700 truncate max-w-[80px]">{top3[1].name}</p>
              <p className="text-xs text-emerald-600 font-bold">{top3[1].ecoPoints} pts</p>
              <div className="mt-2 w-24 h-20 rounded-t-xl flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(to top, #d1d5db, #e5e7eb)" }}>
                🥈
              </div>
            </motion.div>

            {/* 1st Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex flex-col items-center"
            >
              <motion.div animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity }}>
                <img
                  src={top3[0].avatar || `https://api.dicebear.com/8.x/micah/svg?seed=${top3[0].name}`}
                  alt={top3[0].name}
                  className="w-20 h-20 rounded-full border-4 border-yellow-400 bg-gray-100 mb-2 shadow-lg"
                />
              </motion.div>
              <p className="text-sm font-extrabold text-slate-800">{top3[0].name}</p>
              <p className="text-sm text-emerald-600 font-bold">{top3[0].ecoPoints} pts</p>
              <div className="mt-2 w-28 h-28 rounded-t-xl flex items-center justify-center text-4xl"
                style={{ background: "linear-gradient(to top, #fbbf24, #fcd34d)" }}>
                🥇
              </div>
            </motion.div>

            {/* 3rd Place */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col items-center"
            >
              <img
                src={top3[2].avatar || `https://api.dicebear.com/8.x/micah/svg?seed=${top3[2].name}`}
                alt={top3[2].name}
                className="w-14 h-14 rounded-full border-3 border-amber-600 bg-gray-100 mb-2"
              />
              <p className="text-xs font-bold text-slate-700 truncate max-w-[80px]">{top3[2].name}</p>
              <p className="text-xs text-emerald-600 font-bold">{top3[2].ecoPoints} pts</p>
              <div className="mt-2 w-24 h-16 rounded-t-xl flex items-center justify-center text-3xl"
                style={{ background: "linear-gradient(to top, #d97706, #f59e0b)" }}>
                🥉
              </div>
            </motion.div>
          </div>
        )}

        {/* Full List */}
        <div className="rounded-2xl shadow-xl overflow-hidden"
          style={{
            background: "rgba(255, 255, 255, 0.6)",
            backdropFilter: "blur(16px)",
            border: "1px solid rgba(255, 255, 255, 0.3)",
          }}
        >
          <motion.ul variants={containerVariants} initial="hidden" animate="visible">
            {leaders.map((leader, index) => (
              <motion.li
                key={leader._id || index}
                variants={itemVariants}
                className={`flex items-center p-4 border-b border-slate-100/50 last:border-b-0 hover:bg-emerald-50/40 transition ${
                  index < 3 ? "bg-gradient-to-r from-emerald-50/40 to-transparent" : ""
                }`}
              >
                <div className="w-12 text-center">
                  {index < 3 ? (
                    <span className="text-2xl">{MEDALS[index]}</span>
                  ) : (
                    <span className="text-lg font-bold text-slate-400">#{index + 1}</span>
                  )}
                </div>
                <div className="w-12 flex justify-center">
                  <img
                    src={leader.avatar || `https://api.dicebear.com/8.x/micah/svg?seed=${leader.name}`}
                    alt={leader.name}
                    className="w-10 h-10 rounded-full border-2 border-emerald-200 bg-gray-100"
                  />
                </div>
                <div className="flex-1 ml-3">
                  <p className="text-sm font-bold text-slate-800">{leader.name}</p>
                  <p className="text-xs text-slate-400 capitalize">{leader.role}</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-extrabold text-emerald-600">{leader.ecoPoints}</p>
                  <p className="text-[10px] text-slate-400 uppercase tracking-wide">points</p>
                </div>
              </motion.li>
            ))}
          </motion.ul>
        </div>
      </motion.div>
    </div>
  );
}