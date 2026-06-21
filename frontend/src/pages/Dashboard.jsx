import Spinner from '../components/Spinner';
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { motion, AnimatePresence } from "framer-motion";
import AIEcoAdvisor from "../components/AIEcoAdvisor";
import QRCode from "qrcode";

// --- Data, Icons & Config ---
const BADGE_RULES = [
  { name: "Eco Starter", emoji: "🥉", threshold: 50 },
  { name: "Eco Hero", emoji: "🥈", threshold: 100 },
  { name: "Eco Champion", emoji: "🥇", threshold: 200 },
];
const clamp = (n, min, max) => Math.min(Math.max(n, min), max);

const ShareIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.368a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" /></svg>;
const LogoutIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>;
const LeaderboardIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857m0 0a3.004 3.004 0 015.288 0M12 14a3 3 0 100-6 3 3 0 000 6z" /></svg>;
const TeacherIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-2a6 6 0 00-12 0v2" /></svg>;
const AdminIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.096 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const MenuIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>;
const CloseIcon = () => <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;

// --- Main Dashboard Component ---
export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [toast, setToast] = useState(null);
  const [completingId, setCompletingId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const navigate = useNavigate();

  const fetchProfile = async () => {
    try {
      const profileRes = await API.get("/auth/profile");
      setUser(profileRes.data);
    } catch (err) {
      console.error("Failed to fetch profile data:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    try {
      const notificationsRes = await API.get('/notifications');
      const items = notificationsRes.data || [];
      setNotifications(items);
      setUnreadNotifications(items.filter(item => !item.read).length);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  };

  const markNotificationRead = async (id) => {
    try {
      await API.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((item) => item._id === id ? { ...item, read: true } : item));
      setUnreadNotifications((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error('Failed to mark notification read:', err);
    }
  };

  useEffect(() => {
    const fetchChallenges = async () => {
      try {
        const challengesRes = await API.get("/challenges");
        setChallenges(challengesRes.data);
      } catch (err) {
        console.error("Failed to fetch challenges:", err);
      }
    };
    fetchProfile();
    fetchChallenges();
    fetchNotifications();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleProfileSave = async (updatedUser) => {
    try {
      await API.put("/auth/profile", updatedUser);
      setUser(prev => ({ ...prev, ...updatedUser }));
      showToast("Profile updated successfully");
    } catch (err) {
      showToast("Failed to update profile");
    } finally {
      setProfileOpen(false);
    }
  };
  
  const handleShare = async () => {
    const shareText = `I’ve earned ${user.ecoPoints} eco points on GreenSpark! 🌱 Badges: ${(user.badges || []).join(", ")}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "My GreenSpark Progress", text: shareText, url: window.location.href });
      } catch {}
    } else {
      navigator.clipboard.writeText(shareText);
      showToast("Progress copied to clipboard");
    }
  };

  const handleLogout = async () => {
    try {
      await API.post("/auth/logout");
    } catch (err) {
      console.error("Logout failed:", err);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  const certCanvasRef = useRef(null);
  const downloadCertificate = async (badgeName) => {
    const canvas = certCanvasRef.current; 
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const W = 1200, H = 800;
    canvas.width = W; canvas.height = H;
    
    // Background gradient
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    
    // Outer border
    ctx.strokeStyle = "#0f172a"; // Slate 900
    ctx.lineWidth = 12;
    ctx.strokeRect(40, 40, W - 80, H - 80);

    // Inner border
    ctx.strokeStyle = "#cbd5e1"; // Slate 300
    ctx.lineWidth = 2;
    ctx.strokeRect(55, 55, W - 110, H - 110);

    // Header text
    ctx.fillStyle = "#0f172a"; 
    ctx.font = "bold 56px 'Inter', Arial, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("CERTIFICATE OF ACHIEVEMENT", W/2, 180);

    // Subtext
    ctx.fillStyle = "#64748b"; 
    ctx.font = "italic 28px 'Inter', Arial, sans-serif";
    ctx.fillText("This verifies that", W/2, 280);

    // User Name
    ctx.fillStyle = "#0f172a"; 
    ctx.font = "bold 72px 'Inter', Arial, sans-serif";
    ctx.fillText(user.name, W/2, 380);

    // Divider
    ctx.beginPath();
    ctx.moveTo(W/2 - 200, 430);
    ctx.lineTo(W/2 + 200, 430);
    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Badge details
    const rule = BADGE_RULES.find((b) => b.name === badgeName) || { emoji: "🌟", name: badgeName };
    ctx.fillStyle = "#0f172a";
    ctx.font = "bold 40px 'Inter', Arial, sans-serif";
    ctx.fillText(`Has achieved the rank of ${rule.name}`, W/2, 510);
    
    ctx.fillStyle = "#475569";
    ctx.font = "24px 'Inter', Arial, sans-serif";
    ctx.fillText(`For outstanding commitment to sustainability and earning ${user.ecoPoints} Eco Points.`, W/2, 560);

    // Footer Dates and Signatures
    ctx.fillStyle = "#64748b";
    ctx.font = "18px 'Inter', Arial, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText(`DATE ISSUED: ${new Date().toLocaleDateString()}`, 100, 700);
    
    ctx.textAlign = "right";
    ctx.fillText("GREENSPARK VERIFIED SYSTEM", W - 100, 700);

    // Generate QR Code
    try {
      const qrDataUrl = await QRCode.toDataURL(`GreenSpark Certificate Verified\nName: ${user.name}\nBadge: ${rule.name}\nPoints: ${user.ecoPoints}\nDate: ${new Date().toLocaleDateString()}`, {
        width: 140,
        margin: 0,
        color: {
          dark: '#0f172a',
          light: '#ffffff'
        }
      });
      
      const qrImage = new Image();
      qrImage.onload = () => {
        ctx.drawImage(qrImage, W/2 - 70, 610, 140, 140);
        const data = canvas.toDataURL("image/png");
        const a = document.createElement("a");
        a.href = data; a.download = `${badgeName.replace(/\s+/g, '_')}_Certificate.png`; a.click();
      };
      qrImage.src = qrDataUrl;
    } catch (err) {
      console.error("Error generating QR code", err);
      const data = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = data; a.download = `${badgeName.replace(/\s+/g, '_')}_Certificate.png`; a.click();
    }
  };

  if (loading || !user) {
    return (
      <div className="flex h-screen items-center justify-center bg-paper bg-[radial-gradient(circle_at_top_left,_rgba(11,94,58,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(201,154,88,0.18),_transparent_34%)]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-paper bg-[radial-gradient(circle_at_top_left,_rgba(11,94,58,0.16),_transparent_30%),radial-gradient(circle_at_bottom_right,_rgba(201,154,88,0.18),_transparent_34%)] font-sans text-slate-900 pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(circle,_rgba(11,94,58,0.14),_transparent_33%)]" />
      <div className="pointer-events-none absolute right-0 top-28 h-80 w-80 rounded-full bg-gold/20 blur-3xl" />
      <canvas ref={certCanvasRef} style={{ display: "none" }} />
      <Header user={user} onLogout={handleLogout} onShare={handleShare} />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Main Content Area */}
          <main className="flex-1 space-y-8">
            <div className="rounded-[2rem] border border-emerald-200/70 bg-gradient-to-br from-emerald-100/95 via-white/90 to-amber-100/80 p-6 shadow-[0_30px_70px_rgba(16,185,129,0.10)] backdrop-blur-xl">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
                    Overview
                  </h1>
                  <p className="text-sm text-slate-700 mt-1 max-w-xl">
                    Track your environmental impact and progress with a dashboard built for vibrant, focused sustainability insight.
                  </p>
                </div>
                <div className="rounded-3xl bg-emerald-100/90 border border-emerald-200 px-4 py-3 text-sm text-emerald-900 font-semibold shadow-sm">
                  Welcome back, <span className="text-slate-900">{user.name}</span>
                </div>
              </div>
            </div>
            
            {/* Bento Grid layout */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.35 }}>
                <ProfileCard user={user} onEdit={() => setProfileOpen(true)} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.45 }}>
                <StatsCard ecoPoints={user.ecoPoints} />
              </motion.div>

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} whileHover={{ scale: 1.02 }} transition={{ duration: 0.5 }}>
                <StreakCard streak={user.streak} />
              </motion.div>
            </div>

            <div className="pt-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">Certifications & Badges</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {BADGE_RULES.map((badge, i) => (
                  <motion.div key={badge.name} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} whileHover={{ scale: 1.02 }}>
                    <BadgeCard
                      badge={badge}
                      owned={(user.badges || []).includes(badge.name)}
                      onDownload={() => downloadCertificate(badge.name)}
                    />
                  </motion.div>
                ))}
              </div>
            </div>

            <div className="pt-4">
              <h2 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">Active Challenges</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {challenges.map((challenge, idx) => (
                  <motion.div key={challenge._id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} whileHover={{ scale: 1.01 }}>
                    <ChallengeCard
                      key={challenge._id}
                      challenge={challenge}
                      isCompleted={(user.completed || []).includes(challenge._id)}
                      isCompleting={completingId === challenge._id}
                      onComplete={async () => {
                        setCompletingId(challenge._id);
                        try {
                          await API.post("/challenges/complete", { challengeId: challenge._id });
                          await fetchProfile();
                          showToast(`Completed ${challenge.title} (+${challenge.points})`);
                        } catch (err) {
                          console.error("Failed to complete challenge:", err);
                          showToast(err.response?.data?.message || "Action failed.");
                        } finally {
                          setCompletingId(null);
                        }
                      }}
                    />
                  </motion.div>
                ))}
              </div>
            </div>
          </main>

          {/* Right Sidebar Area (Notifications) */}
          <aside className="w-full lg:w-80 flex-shrink-0">
            <div className="bg-white/95 border border-slate-200/70 rounded-2xl shadow-2xl p-5 sticky top-24 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold tracking-tight text-slate-900">Notifications</h3>
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={() => notifications.filter(n => !n.read).forEach((n) => markNotificationRead(n._id))}
                      className="text-xs font-medium text-forest hover:text-forest-700 hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-sm text-slate-700">You're all caught up.</p>
                ) : (
                  notifications.slice(0, 5).map((notification, i) => (
                    <motion.div key={notification._id} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }} whileHover={{ x: 2 }} className="group relative pl-3 border-l-2 border-transparent hover:border-emerald-500 transition-colors">
                      {/* Unread dot */}
                      {!notification.read && <span className="absolute -left-[5px] top-1.5 w-2 h-2 rounded-full bg-emerald-500"></span>}
                      
                      <div className="flex flex-col">
                        <p className={`text-sm ${notification.read ? 'text-slate-700 font-normal' : 'text-slate-900 font-medium'}`}>{notification.title}</p>
                        <p className="text-xs text-slate-600 mt-0.5 line-clamp-2">{notification.message}</p>
                        <div className="flex justify-between items-center mt-1.5">
                          <p className="text-[10px] text-slate-500 uppercase tracking-wider">{new Date(notification.createdAt).toLocaleDateString()}</p>
                          {!notification.read && (
                            <button
                              type="button"
                              onClick={() => markNotificationRead(notification._id)}
                              className="text-[10px] font-medium text-slate-400 hover:text-emerald-600 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>
      
      <AnimatePresence>
        {profileOpen && <ProfileModal user={user} onClose={() => setProfileOpen(false)} onSave={handleProfileSave} />}
      </AnimatePresence>
      <AIEcoAdvisor onToggle={() => setChatbotOpen(prev => !prev)} isOpen={chatbotOpen}/>
      
      <AnimatePresence>
       {toast && <Toast message={toast} />}
      </AnimatePresence>
    </div>
  );
}

// --- Sub-components ---

const Header = ({ user, onLogout, onShare }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const toggleMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);

  return (
    <header className="sticky top-0 z-40 border-b border-emerald-800/20 bg-gradient-to-r from-forest via-emerald-800 to-gold/30 shadow-[0_32px_90px_rgba(15,23,42,0.18)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-emerald-400 via-teal-500 to-amber-400 shadow-lg shadow-emerald-500/20 flex items-center justify-center text-white text-xl">
            🌿
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-white">GreenSpark</h1>
            <p className="text-sm font-medium text-white/90 mt-0.5">High-energy eco dashboard with bright analytics and mission cards.</p>
          </div>
        </div>

        <div className="hidden lg:flex items-center flex-wrap gap-2">
          {user.role === 'admin' && (
            <Link to="/admin-panel" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900 bg-amber-100/90 border border-amber-200 rounded-2xl shadow-sm hover:scale-[1.01] transition">
              <AdminIcon /> Admin
            </Link>
          )}
          {user.role === 'teacher' && (
            <Link to="/teacher-panel" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-slate-900 bg-emerald-100/90 border border-emerald-200 rounded-2xl shadow-sm hover:scale-[1.01] transition">
              <TeacherIcon /> Teacher
            </Link>
          )}

          {[
            { to: "/carbon-tracker", label: "Tracker" },
            { to: "/grid-simulator", label: "Grid" },
            { to: "/dac-simulator", label: "DAC" },
            { to: "/bioreactor-simulator", label: "Bioreactor" },
            { to: "/learn/lessons", label: "Learn" }
          ].map((link) => (
            <Link key={link.to} to={link.to} className="px-4 py-2 text-sm font-medium text-white bg-emerald-500/90 hover:bg-emerald-400/95 rounded-2xl shadow-lg shadow-emerald-500/20 transition">
              {link.label}
            </Link>
          ))}

          <button onClick={onShare} className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-slate-900 bg-amber-200/95 hover:bg-amber-100 rounded-2xl shadow-sm transition">
            <ShareIcon />
          </button>
          <button onClick={onLogout} className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold text-white bg-slate-900/95 hover:bg-slate-800 rounded-2xl shadow-lg shadow-slate-900/20 transition">
            <LogoutIcon />
          </button>
        </div>

        <div className="lg:hidden w-full flex justify-between items-center">
          <div className="flex-1 flex flex-wrap gap-2">
            {user.role === 'admin' && (
              <Link to="/admin-panel" className="px-3 py-2 text-xs font-semibold text-slate-900 bg-amber-100/90 rounded-2xl shadow-sm">Admin</Link>
            )}
            {user.role === 'teacher' && (
              <Link to="/teacher-panel" className="px-3 py-2 text-xs font-semibold text-slate-900 bg-emerald-100/90 rounded-2xl shadow-sm">Teacher</Link>
            )}
          </div>
          <button onClick={toggleMenu} className="p-2 text-white hover:text-white bg-white/15 hover:bg-white/25 rounded-2xl focus:outline-none transition">
            {isMobileMenuOpen ? <CloseIcon /> : <MenuIcon />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden bg-slate-950/95 border-t border-slate-700/30 px-4 py-4">
          <div className="flex flex-col gap-2">
            {user.role === 'admin' && (
              <Link to="/admin-panel" className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-900 bg-amber-100/90 rounded-2xl">Admin Panel</Link>
            )}
            {user.role === 'teacher' && (
              <Link to="/teacher-panel" className="flex items-center gap-2 px-4 py-3 text-sm font-semibold text-slate-900 bg-emerald-100/90 rounded-2xl">Teacher Panel</Link>
            )}
            {[
              { to: "/carbon-tracker", label: "Carbon Tracker" },
              { to: "/grid-simulator", label: "Grid Simulator" },
              { to: "/dac-simulator", label: "DAC Simulator" },
              { to: "/bioreactor-simulator", label: "Bioreactor Simulator" },
              { to: "/learn/lessons", label: "Learning Modules" }
            ].map((link) => (
              <Link key={link.to} to={link.to} className="block px-4 py-3 text-sm font-medium text-white bg-emerald-600/90 rounded-2xl hover:bg-emerald-500/95 transition">
                {link.label}
              </Link>
            ))}
            <Link to="/leaderboard" className="block px-4 py-3 text-sm font-medium text-slate-900 bg-amber-100/90 rounded-2xl">Leaderboard</Link>
            <button onClick={onShare} className="w-full px-4 py-3 text-sm font-semibold text-slate-900 bg-amber-200/95 rounded-2xl">Share Progress</button>
            <button onClick={onLogout} className="w-full px-4 py-3 text-sm font-semibold text-white bg-slate-900/95 rounded-2xl">Logout</button>
          </div>
        </div>
      )}
    </header>
  );
};

const ProfileCard = ({ user, onEdit }) => (
  <div className="bg-gradient-to-br from-emerald-50 via-white/90 to-amber-50/90 p-6 rounded-[2rem] border border-emerald-100/80 shadow-[0_30px_70px_rgba(16,185,129,0.10)] flex flex-col items-center justify-center transform-gpu transition hover:shadow-[0_28px_64px_rgba(16,185,129,0.18)]">
    <img src={user.avatar || `https://api.dicebear.com/8.x/micah/svg?seed=${user.name}`} alt="Avatar" className="w-20 h-20 rounded-full border-2 border-white shadow-lg object-cover mb-4"/>
    <h2 className="text-xl font-semibold tracking-tight text-slate-900">{user.name}</h2>
    <p className="text-sm text-slate-600 font-medium mb-3">{user.email}</p>
    <span className="px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-widest bg-emerald-100 text-emerald-700 border border-emerald-200">{user.role}</span>
    <button onClick={onEdit} className="mt-6 w-full px-4 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 via-emerald-500 to-amber-500 rounded-2xl hover:scale-[1.01] transition shadow-xl">Manage Profile</button>
  </div>
);

const StatsCard = ({ ecoPoints }) => {
  const maxPoints = Math.max(...BADGE_RULES.map(rule => rule.threshold));
  const progress = useMemo(() => clamp((ecoPoints / maxPoints) * 100, 0, 100), [ecoPoints, maxPoints]);
  
  return (
    <div className="bg-gradient-to-br from-emerald-50 via-white/95 to-cyan-50/90 p-6 rounded-[2rem] border border-emerald-100/70 shadow-[0_30px_70px_rgba(16,185,129,0.12)] flex flex-col justify-between backdrop-blur-xl">
      <div>
        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-1">Total Impact</p>
        <div className="flex items-baseline gap-2">
          <p className="text-5xl font-extrabold tracking-tight text-slate-900">{ecoPoints}</p>
          <p className="text-sm font-medium text-slate-600">pts</p>
        </div>
      </div>
      
      <div className="mt-6">
        <div className="flex justify-between text-sm font-semibold text-slate-700 mb-2">
          <span>Progress to Champion</span>
          <span>{Math.round(progress)}%</span>
        </div>
        <div className="w-full bg-emerald-100/60 rounded-full h-3 overflow-hidden">
          <motion.div className="bg-gradient-to-r from-emerald-500 via-emerald-600 to-gold-500 h-3 rounded-full shadow-[0_0_25px_rgba(16,185,129,0.2)]" initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 1.1, ease: "easeOut" }} />
        </div>
      </div>
    </div>
  );
};

const StreakCard = ({ streak }) => {
  const currentStreak = streak?.currentStreak || 0;
  const longestStreak = streak?.longestStreak || 0;
  
  return (
    <div className="bg-gradient-to-br from-cyan-50 via-white/95 to-emerald-50 p-6 rounded-[2rem] border border-emerald-100/70 shadow-[0_30px_70px_rgba(16,185,129,0.12)] flex flex-col justify-between backdrop-blur-xl">
      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-widest mb-1">Current Streak</p>
      <div className="flex items-baseline gap-2">
        <p className="text-4xl font-semibold tracking-tight text-slate-900">{currentStreak}</p>
        <p className="text-sm font-medium text-slate-600">days</p>
      </div>

      <div className="mt-6 pt-4 border-t border-emerald-100/50">
        <div className="flex justify-between items-center text-xs">
          <span className="font-medium text-slate-600">Personal Best</span>
          <span className="font-semibold text-slate-900">{longestStreak} days</span>
        </div>
      </div>
    </div>
  );
};

const BadgeCard = ({ badge, owned, onDownload }) => (
  <div className="bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50 p-5 rounded-[2rem] border border-emerald-100/70 shadow-[0_28px_60px_rgba(16,185,129,0.10)] flex flex-col">
    <div className="flex justify-between items-start mb-4">
      <div className={`text-3xl ${owned ? '' : 'opacity-40 grayscale'}`}>{badge.emoji}</div>
      <div className={`px-3 py-1 rounded-full text-[10px] font-semibold uppercase tracking-wider ${owned ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
        {owned ? 'Unlocked' : 'Locked'}
      </div>
    </div>
    
    <h3 className="text-sm font-semibold text-slate-900 mb-1">{badge.name}</h3>
    <p className="text-sm text-slate-600 mb-5">{badge.threshold} pts required</p>
    
    <button
      type="button"
      onClick={onDownload}
      disabled={!owned}
      className={`mt-auto w-full px-4 py-3 text-sm font-semibold rounded-2xl transition ${owned ? 'text-white bg-gradient-to-r from-emerald-600 via-teal-500 to-gold-500 shadow-xl' : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed'}`}
    >
      Download Certificate
    </button>
  </div>
);

const ChallengeCard = ({ challenge, isCompleted, isCompleting, onComplete }) => (
  <div className={`bg-gradient-to-br from-slate-50 via-emerald-50 to-amber-50 p-5 rounded-[2rem] border border-emerald-100/40 shadow-[0_28px_60px_rgba(16,185,129,0.10)] flex flex-col ${isCompleted ? 'ring-1 ring-gold-300/40 bg-amber-100/70' : 'bg-white/95'}`}>
    <div className="flex justify-between items-start mb-3">
      <div className="p-3 bg-emerald-100/90 rounded-2xl border border-emerald-200 text-lg shadow-sm">{challenge.icon || '🌿'}</div>
      <span className="text-xs font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full border border-slate-200">+{challenge.points}</span>
    </div>
    <h3 className="font-semibold text-base text-slate-900 mb-2 line-clamp-1">{challenge.title}</h3>
    <p className="text-sm text-slate-600 mb-5 line-clamp-2 flex-grow">{challenge.description}</p>
    
    <button
      onClick={onComplete}
      disabled={isCompleted || isCompleting}
      className={`w-full px-4 py-3 text-sm font-semibold rounded-2xl transition ${isCompleted ? 'text-slate-700 bg-amber-100 border border-amber-200 cursor-default' : isCompleting ? 'text-slate-500 bg-slate-100 border border-slate-200' : 'text-white bg-gradient-to-r from-emerald-600 via-teal-500 to-gold-500 hover:opacity-95 shadow-xl'}`}
    >
      {isCompleted ? 'Completed' : isCompleting ? 'Processing...' : 'Complete Task'}
    </button>
  </div>
);

const ProfileModal = ({ user, onClose, onSave }) => {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);
  const fileRef = useRef(null);
  const handleSave = () => { onSave({ name, email, avatar }); };
  const onFileChange = (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setAvatar(reader.result);
    reader.readAsDataURL(file);
  };
  
  return (
    <div className="fixed inset-0 bg-slate-900/20 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl border border-slate-200" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900 mb-4">Edit Profile</h2>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Name</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none transition"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-1 block">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full px-3 py-2 bg-white border border-slate-300 rounded-md text-sm focus:border-slate-500 focus:ring-1 focus:ring-slate-500 focus:outline-none transition"/>
          </div>
          <div>
            <label className="text-xs font-semibold text-slate-600 mb-2 block">Avatar</label>
            <div className="flex items-center gap-3">
              <img src={avatar || `https://api.dicebear.com/8.x/micah/svg?seed=${user.name}`} alt="Avatar" className="w-12 h-12 rounded-full border border-slate-200 object-cover"/>
              <button onClick={() => fileRef.current.click()} className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50 transition shadow-sm">Upload</button>
              <input type="file" ref={fileRef} onChange={onFileChange} className="hidden" accept="image/*"/>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-slate-100">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 transition">Cancel</button>
          <button onClick={handleSave} className="px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 shadow-sm transition">Save</button>
        </div>
      </div>
    </div>
  )
};

const Toast = ({ message }) => (
  <div className="fixed bottom-6 right-6 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg font-medium text-sm z-50">
    {message}
  </div>
);