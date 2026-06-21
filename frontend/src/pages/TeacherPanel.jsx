// src/pages/TeacherPanel.jsx

import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../api/api";
import { motion, AnimatePresence } from "framer-motion";

export default function TeacherPanel() {
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [assignedStudents, setAssignedStudents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [toast, setToast] = useState(null);
  const [view, setView] = useState('all');
  const [analytics, setAnalytics] = useState(null);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [isNotifyModalOpen, setIsNotifyModalOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [studentsRes, challengesRes, assignedRes, analyticsRes] = await Promise.all([
            API.get("/teacher/students"),
            API.get("/challenges"),
            API.get("/teacher/assigned-students"),
            API.get("/teacher/analytics")
        ]);
        setStudents(studentsRes.data);
        setChallenges(challengesRes.data);
        setAssignedStudents(assignedRes.data);
        setAnalytics(analyticsRes.data);
      } catch (err) {
        setError("You do not have permission to view this page or an error occurred.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };
 
  const handleOpenAssignModal = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };
 
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  }

  const handleOpenNotificationModal = () => {
    setIsNotifyModalOpen(true);
  };

  const handleCloseNotificationModal = () => {
    setIsNotifyModalOpen(false);
  };

  const handleSendNotification = async (notificationData) => {
    if (!notificationData.title.trim() || !notificationData.message.trim()) {
      alert('Please enter a title and a message before sending.');
      return;
    }

    const recipientIds = notificationData.recipient === 'all'
      ? students.map((student) => student._id)
      : [notificationData.recipient];

    if (recipientIds.length === 0) {
      alert('Please select at least one recipient.');
      return;
    }

    try {
      await API.post('/notifications/send', {
        recipients: recipientIds,
        title: notificationData.title,
        message: notificationData.message,
        type: notificationData.type,
        link: notificationData.link || null,
      });
      showToast('Notification sent successfully!');
      handleCloseNotificationModal();
    } catch (err) {
      console.error('Failed to send notification:', err);
      showToast(err.response?.data?.message || 'Failed to send notification.');
    }
  };

  const handleAssignChallenge = async (assignmentData) => {
    try {
        await API.post('/teacher/assignments', {
            studentId: selectedStudent._id,
            challengeId: assignmentData.challengeId,
            dueDate: assignmentData.dueDate,
        });
        showToast(`Challenge assigned to ${selectedStudent.name}!`);
        const assignedRes = await API.get("/teacher/assigned-students");
        setAssignedStudents(assignedRes.data);
    } catch (err) {
        console.error("Assignment failed:", err);
        showToast(err.response?.data?.message || 'Failed to assign challenge.');
    } finally {
        handleCloseModal();
    }
  };


  if (loading) {
    return <div className="text-center p-10 font-semibold text-emerald-800">Loading Student Data...</div>;
  }
 
  if (error) {
    return (
       <div className="text-center p-10">
         <p className="text-red-500 font-semibold">{error}</p>
         <Link to="/dashboard" className="mt-4 inline-block px-4 py-2 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 transition">
            Go to Dashboard
         </Link>
       </div>
    );
  }
 
  const studentsToShow = view === 'all' ? students : assignedStudents;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-slate-50 to-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto bg-white/80 backdrop-blur-xl border border-emerald-100 rounded-[32px] p-6 shadow-2xl">
        <div className="flex flex-wrap justify-between items-center gap-4 mb-6">
          <h1 className="text-4xl font-bold text-emerald-950">Teacher Panel</h1>
          <button
            onClick={() => {
              console.log('Navigating to dashboard');
              navigate('/dashboard');
            }}
            className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition"
          >
            ← Back to Dashboard
          </button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center gap-2 mb-6">
            <button
              onClick={() => setView('all')}
              className={`px-4 py-2 font-semibold rounded-full transition ${view === 'all' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-emerald-100 text-emerald-900'}`}
            >
              All Students ({students.length})
            </button>
            <button
              onClick={() => setView('assigned')}
              className={`px-4 py-2 font-semibold rounded-full transition ${view === 'assigned' ? 'bg-emerald-700 text-white shadow-lg' : 'bg-emerald-100 text-emerald-900'}`}
            >
              Assigned Students ({assignedStudents.length})
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-4 py-2 font-semibold rounded-full transition ${showAnalytics ? 'bg-amber-500 text-white shadow-lg' : 'bg-emerald-100 text-emerald-900'}`}
            >
              Analytics {showAnalytics ? '▼' : '▶'}
            </button>

            <button
              onClick={handleOpenNotificationModal}
              className="px-4 py-2 bg-emerald-600 text-white font-semibold rounded-full shadow-lg hover:bg-emerald-700 transition"
            >
              Send Notification
            </button>

            <Link
              to="/manage-lessons"
              className="ml-auto px-4 py-2 font-semibold rounded-full transition bg-amber-500 text-slate-950 hover:bg-amber-600"
            >
              Manage Lessons
            </Link>
          </div>

          {/* Analytics Section */}
          {showAnalytics && analytics && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-emerald-100 via-emerald-50 to-white rounded-3xl shadow-2xl p-6 mb-6 border border-emerald-100"
            >
              <h2 className="text-2xl font-bold text-emerald-950 mb-4">Class Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white/90 p-4 rounded-2xl shadow-md text-center border border-emerald-100">
                  <p className="text-3xl font-bold text-emerald-700">{analytics.totalStudents}</p>
                  <p className="text-sm text-emerald-900">Total Students</p>
                </div>
                <div className="bg-white/90 p-4 rounded-2xl shadow-md text-center border border-emerald-100">
                  <p className="text-3xl font-bold text-lime-600">{analytics.avgEcoPoints}</p>
                  <p className="text-sm text-emerald-900">Avg Eco Points</p>
                </div>
                <div className="bg-white/90 p-4 rounded-2xl shadow-md text-center border border-emerald-100">
                  <p className="text-3xl font-bold text-amber-600">{analytics.completionRate}%</p>
                  <p className="text-sm text-emerald-900">Completion Rate</p>
                </div>
                <div className="bg-white/90 p-4 rounded-2xl shadow-md text-center border border-emerald-100">
                  <p className="text-3xl font-bold text-teal-600">{analytics.activeStreaks}</p>
                  <p className="text-sm text-emerald-900">Active Streaks</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-emerald-900 mb-3">Top Performers</h3>
              <div className="bg-white/90 rounded-2xl shadow-md overflow-hidden border border-emerald-100">
                <table className="min-w-full">
                  <thead className="bg-emerald-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-emerald-700">Rank</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-emerald-700">Name</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-emerald-700">Eco Points</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-emerald-700">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topStudents.map((student, index) => (
                      <tr key={index} className="border-t border-emerald-100 hover:bg-emerald-50">
                        <td className="px-4 py-2 text-sm">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-emerald-950">{student.name}</td>
                        <td className="px-4 py-2 text-sm text-center text-lime-700 font-semibold">{student.ecoPoints}</td>
                        <td className="px-4 py-2 text-sm text-center text-amber-600">{student.streak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="bg-emerald-50/80 rounded-3xl shadow-2xl overflow-x-auto border border-emerald-100">
            <table className="min-w-full divide-y divide-emerald-200">
              <thead className="bg-emerald-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-emerald-700 uppercase tracking-wider">Eco Points</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-emerald-700 uppercase tracking-wider">Badges Earned</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-emerald-700 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white/90 divide-y divide-emerald-200">
                {studentsToShow.map((student) => (
                  <tr key={student._id} className="hover:bg-emerald-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-950">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-lime-700">{student.ecoPoints}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-emerald-700">
                      {(student.badges || []).length > 0 ? student.badges.join(', ') : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleOpenAssignModal(student)}
                        className="px-3 py-1 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition text-xs"
                      >
                        Assign Challenge
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        <AnimatePresence>
          {isModalOpen && (
            <AssignmentModal
              student={selectedStudent}
              challenges={challenges}
              onClose={handleCloseModal}
              onAssign={handleAssignChallenge}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isNotifyModalOpen && (
            <NotificationModal
              students={students}
              onClose={handleCloseNotificationModal}
              onSend={handleSendNotification}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {toast && <Toast message={toast} />}
        </AnimatePresence>
      </div>
    </div>
  );
}


function AssignmentModal({ student, challenges, onClose, onAssign }) {
  const [selectedChallengeId, setSelectedChallengeId] = useState('');
  const [dueDate, setDueDate] = useState('');

  const handleSubmit = () => {
    if (!selectedChallengeId) {
      alert('Please select a challenge to assign.');
      return;
    }
    onAssign({
      challengeId: selectedChallengeId,
      dueDate: dueDate || null,
    });
  };

  return (
     <motion.div 
      className="fixed inset-0 bg-slate-950/70 z-50 flex items-center justify-center p-4"
      initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
      onClick={onClose}
    >
        <motion.div
            className="bg-white/95 rounded-[28px] p-6 w-full max-w-lg shadow-2xl border border-emerald-100"
            initial={{scale: 0.8, y: 50}} animate={{scale: 1, y: 0}} exit={{scale: 0.8, y: 50}}
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-2xl font-bold mb-2 text-emerald-900">Assign Challenge</h2>
            <p className="mb-6 text-emerald-700">Assign a new task to <span className="font-semibold text-emerald-900">{student.name}</span>.</p>
            
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-emerald-700 mb-1">Challenge</label>
                 <select
                   value={selectedChallengeId}
                   onChange={(e) => setSelectedChallengeId(e.target.value)}
                   className="w-full p-3 border border-emerald-200 rounded-2xl bg-emerald-50/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                 >
                   <option value="" disabled>Select a challenge...</option>
                   {challenges.map(challenge => (
                     <option key={challenge._id} value={challenge._id}>
                        {challenge.title} (+{challenge.points} pts)
                     </option>
                   ))}
                 </select>
               </div>
               
               <div>
                 <label className="block text-sm font-medium text-emerald-700 mb-1">Due Date (Optional)</label>
                 <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-3 border border-emerald-200 rounded-2xl bg-emerald-50/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
                 />
               </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button 
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-emerald-100 text-emerald-900 font-semibold rounded-full hover:bg-emerald-200 transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition"
                >
                    Assign
                </button>
            </div>
        </motion.div>
     </motion.div>
  );
}


function NotificationModal({ students, onClose, onSend }) {
  const [recipient, setRecipient] = useState('all');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('announcement');
  const [link, setLink] = useState('');

  const handleSubmit = () => {
    onSend({ recipient, title, message, type, link });
  };

  return (
    <motion.div
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
    >
      <motion.div
        className="bg-white/95 rounded-[28px] p-6 w-full max-w-xl shadow-2xl border border-emerald-100"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2 text-emerald-900">Send Notification</h2>
        <p className="mb-4 text-emerald-700">Notify one or all students with an update.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">Recipient</label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-3 border border-emerald-200 rounded-2xl bg-emerald-50/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>{student.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">Notification Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 border border-emerald-200 rounded-2xl bg-emerald-50/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
            >
              <option value="announcement">Announcement</option>
              <option value="assignment">Assignment</option>
              <option value="challenge">Challenge</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-emerald-200 rounded-2xl bg-emerald-50/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              placeholder="Enter a short title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-3 border border-emerald-200 rounded-2xl bg-emerald-50/80 min-h-[120px] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              placeholder="Type the notification message here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-emerald-700 mb-1">Optional Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full p-3 border border-emerald-200 rounded-2xl bg-emerald-50/80 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 outline-none"
              placeholder="/student/assignments or another internal path"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-emerald-100 text-emerald-900 font-semibold rounded-full hover:bg-emerald-200 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-emerald-600 text-white font-semibold rounded-full hover:bg-emerald-700 transition"
          >
            Send Notification
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function Toast({ message }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-emerald-900 text-white px-6 py-3 rounded-full shadow-2xl"
    >
      {message}
    </motion.div>
  );
}