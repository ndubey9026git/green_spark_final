// src/pages/AdminPanel.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // State for modals
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [isChallengeModalOpen, setIsChallengeModalOpen] = useState(false);
  const [editingChallenge, setEditingChallenge] = useState(null); // To hold challenge data for editing

  const fetchData = async () => {
    try {
      const [usersRes, challengesRes] = await Promise.all([
        API.get("/admin/users"),
        API.get("/challenges"),
      ]);
      setUsers(usersRes.data);
      setChallenges(challengesRes.data);
    } catch (err) {
      setError("You do not have permission to view this page or an error occurred.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- Handlers ---
  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
      localStorage.clear();
      navigate("/");
    } catch (err) {
      console.error("Logout failed:", err);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user?")) {
      try {
        await API.delete(`/admin/users/${userId}`);
        fetchData(); 
      } catch (err) {
        alert("Failed to delete user.");
      }
    }
  };
  
  const handleDeleteChallenge = async (challengeId) => {
     if (window.confirm("Are you sure you want to delete this challenge?")) {
      try {
        await API.delete(`/admin/challenges/${challengeId}`);
        fetchData();
      } catch (err) {
        alert("Failed to delete challenge.");
      }
    }
  };
  
  const handleSaveUser = async (newUserData) => {
    try {
        // Corrected API path
        await API.post('/admin/users', newUserData);
        setIsUserModalOpen(false);
        fetchData();
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to create user.');
    }
  };
  
  // ✅ UPDATED: Handler for both creating and updating challenges
  const handleSaveChallenge = async (challengeData) => {
    try {
        if (editingChallenge) {
            // This is an update
            await API.put(`/admin/challenges/${editingChallenge._id}`, challengeData);
        } else {
            // This is a creation
            await API.post('/admin/challenges', challengeData);
        }
        setIsChallengeModalOpen(false);
        setEditingChallenge(null);
        fetchData();
    } catch (err) {
        alert(err.response?.data?.message || 'Failed to save challenge.');
    }
  };

  const openChallengeModal = (challenge = null) => {
      setEditingChallenge(challenge); // If null, it's 'create' mode. If has data, it's 'edit' mode.
      setIsChallengeModalOpen(true);
  }

  if (loading) return <div className="p-10 text-center">Loading Admin Data...</div>;
  if (error) return <div className="p-10 text-center text-red-500">{error}</div>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-white p-4 sm:p-8">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-7xl mx-auto bg-white/80 backdrop-blur-xl border border-emerald-100 shadow-2xl rounded-[32px] p-6">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
          <h1 className="text-4xl font-bold text-emerald-950">🛠️ Admin Panel</h1>
          <div className="flex flex-wrap items-center gap-2">
            <Link to="/dashboard" className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition text-sm">
              View Student Dashboard
            </Link>
            <button onClick={handleLogout} className="px-4 py-2 bg-stone-700 text-white font-semibold rounded-full shadow-lg hover:bg-stone-800 transition text-sm">
              Logout
            </button>
          </div>
        </div>

        {/* Users Section */}
        <section className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-emerald-900">User Management</h2>
            <button onClick={() => setIsUserModalOpen(true)} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition text-sm">
              Create New User
            </button>
          </div>
          <div className="bg-emerald-50/80 rounded-3xl shadow-2xl overflow-x-auto border border-emerald-100">
            <table className="min-w-full divide-y divide-emerald-200">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Role</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 divide-y divide-emerald-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-950">{user.name}</td>
                    <td className="px-6 py-4 text-sm text-emerald-700">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-emerald-700 capitalize">{user.role}</td>
                    <td className="px-6 py-4 text-center">
                       <button onClick={() => handleDeleteUser(user._id)} className="text-amber-700 hover:text-amber-950 font-semibold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* ✅ UPDATED: Challenges Section now has Create and Edit buttons */}
        <section>
           <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold text-emerald-900">Challenge Management</h2>
            <button onClick={() => openChallengeModal()} className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition text-sm">
              Create New Challenge
            </button>
          </div>
          <div className="bg-emerald-50/80 rounded-3xl shadow-2xl overflow-x-auto border border-emerald-100">
             <table className="min-w-full divide-y divide-emerald-200">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-emerald-700 uppercase">Title</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-emerald-700 uppercase">Points</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-emerald-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 divide-y divide-emerald-200">
                {challenges.map((challenge) => (
                   <tr key={challenge._id}>
                    <td className="px-6 py-4 text-sm font-medium text-emerald-950">{challenge.title}</td>
                    <td className="px-6 py-4 text-sm text-emerald-700 text-center">{challenge.points}</td>
                    <td className="px-6 py-4 text-center text-sm space-x-4">
                       <button onClick={() => openChallengeModal(challenge)} className="text-emerald-700 hover:text-emerald-900 font-semibold">Edit</button>
                       <button onClick={() => handleDeleteChallenge(challenge._id)} className="text-amber-700 hover:text-amber-950 font-semibold">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </motion.div>

      <AnimatePresence>
          {isUserModalOpen && (
              <UserModal 
                onClose={() => setIsUserModalOpen(false)}
                onSave={handleSaveUser}
              />
          )}
          {isChallengeModalOpen && (
              <ChallengeModal
                challenge={editingChallenge}
                onClose={() => {setIsChallengeModalOpen(false); setEditingChallenge(null);}}
                onSave={handleSaveChallenge}
              />
          )}
      </AnimatePresence>
    </div>
  );
}


function UserModal({ onClose, onSave }) {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('teacher');

    const handleSubmit = () => {
        if (!name || !email || !password) {
            alert('Please fill out all fields.');
            return;
        }
        onSave({ name, email, password, role });
    };

    return (
        <motion.div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={onClose}>
            <motion.div className="bg-white/95 rounded-[28px] p-6 w-full max-w-md shadow-2xl border border-emerald-100" initial={{scale: 0.8}} animate={{scale: 1}} exit={{scale: 0.8}} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-emerald-900">Create New User</h2>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-emerald-700">Name</label><input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-emerald-50/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"/></div>
                    <div><label className="block text-sm font-medium text-emerald-700">Email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-emerald-50/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"/></div>
                    <div><label className="block text-sm font-medium text-emerald-700">Password</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-emerald-50/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"/></div>
                    <div><label className="block text-sm font-medium text-emerald-700">Role</label><select value={role} onChange={e => setRole(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-white"><option value="teacher">Teacher</option><option value="student">Student</option><option value="admin">Admin</option></select></div>
                </div>
                <div className="flex justify-end gap-3 mt-6"><button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full hover:bg-emerald-200 transition">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition">Save User</button></div>
            </motion.div>
        </motion.div>
    );
}

function ChallengeModal({ challenge, onClose, onSave }) {
    const [title, setTitle] = useState(challenge?.title || '');
    const [description, setDescription] = useState(challenge?.description || '');
    const [points, setPoints] = useState(challenge?.points || 10);
    const [icon, setIcon] = useState(challenge?.icon || '⭐');

    const handleSubmit = () => {
        if (!title || !points || !icon) {
            alert('Please fill out Title, Points, and Icon fields.');
            return;
        }
        onSave({ title, description, points: Number(points), icon });
    };
    
    return (
        <motion.div className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4" initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}} onClick={onClose}>
            <motion.div className="bg-white/95 rounded-[28px] p-6 w-full max-w-md shadow-2xl border border-emerald-100" initial={{scale: 0.8}} animate={{scale: 1}} exit={{scale: 0.8}} onClick={(e) => e.stopPropagation()}>
                <h2 className="text-2xl font-bold mb-4 text-emerald-900">{challenge ? 'Edit Challenge' : 'Create New Challenge'}</h2>
                <div className="space-y-4">
                    <div><label className="block text-sm font-medium text-emerald-700">Title</label><input type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-emerald-50/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"/></div>
                    <div><label className="block text-sm font-medium text-emerald-700">Icon (Emoji)</label><input type="text" value={icon} onChange={e => setIcon(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-emerald-50/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"/></div>
                    <div><label className="block text-sm font-medium text-emerald-700">Points</label><input type="number" value={points} onChange={e => setPoints(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-emerald-50/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"/></div>
                    <div><label className="block text-sm font-medium text-emerald-700">Description</label><textarea value={description} onChange={e => setDescription(e.target.value)} className="w-full p-3 mt-1 border border-emerald-200 rounded-2xl bg-emerald-50/70 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none" rows="3"></textarea></div>
                </div>
                <div className="flex justify-end gap-3 mt-6"><button onClick={onClose} className="px-4 py-2 text-sm font-semibold text-emerald-700 bg-emerald-100 rounded-full hover:bg-emerald-200 transition">Cancel</button><button onClick={handleSubmit} className="px-4 py-2 text-sm font-semibold text-white bg-emerald-600 rounded-full hover:bg-emerald-700 transition">Save Challenge</button></div>
            </motion.div>
        </motion.div>
    );
}