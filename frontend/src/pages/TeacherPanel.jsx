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
    return <div className="text-center p-10 font-semibold text-gray-500">Loading Student Data...</div>;
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
    <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800">Teacher Panel</h1>
          <button
            onClick={() => {
              console.log('Navigating to dashboard');
              navigate('/dashboard');
            }}
            className="px-4 py-2 bg-white text-gray-700 font-semibold rounded-lg shadow-md hover:bg-gray-200 transition"
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
              className={`px-4 py-2 font-semibold rounded-lg transition ${view === 'all' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
            >
              All Students ({students.length})
            </button>
            <button
              onClick={() => setView('assigned')}
              className={`px-4 py-2 font-semibold rounded-lg transition ${view === 'assigned' ? 'bg-green-600 text-white' : 'bg-white text-gray-700'}`}
            >
              Assigned Students ({assignedStudents.length})
            </button>
            <button
              onClick={() => setShowAnalytics(!showAnalytics)}
              className={`px-4 py-2 font-semibold rounded-lg transition ${showAnalytics ? 'bg-orange-500 text-white' : 'bg-white text-gray-700'}`}
            >
              Analytics {showAnalytics ? '▼' : '▶'}
            </button>

            <button
              onClick={handleOpenNotificationModal}
              className="px-4 py-2 bg-blue-500 text-white font-semibold rounded-lg shadow-md hover:bg-blue-600 transition"
            >
              Send Notification
            </button>

            <Link
              to="/manage-lessons"
              className="ml-auto px-4 py-2 font-semibold rounded-lg transition bg-green-600 text-white hover:bg-green-700"
            >
              Manage Lessons
            </Link>
          </div>

          {/* Analytics Section */}
          {showAnalytics && analytics && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl shadow-xl p-6 mb-6"
            >
              <h2 className="text-2xl font-bold text-gray-800 mb-4">Class Analytics</h2>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                  <p className="text-3xl font-bold text-blue-600">{analytics.totalStudents}</p>
                  <p className="text-sm text-gray-600">Total Students</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                  <p className="text-3xl font-bold text-green-600">{analytics.avgEcoPoints}</p>
                  <p className="text-sm text-gray-600">Avg Eco Points</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                  <p className="text-3xl font-bold text-purple-600">{analytics.completionRate}%</p>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                </div>
                <div className="bg-white p-4 rounded-xl shadow-md text-center">
                  <p className="text-3xl font-bold text-orange-600">{analytics.activeStreaks}</p>
                  <p className="text-sm text-gray-600">Active Streaks</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-800 mb-3">Top Performers</h3>
              <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Rank</th>
                      <th className="px-4 py-2 text-left text-sm font-semibold text-gray-600">Name</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">Eco Points</th>
                      <th className="px-4 py-2 text-center text-sm font-semibold text-gray-600">Streak</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topStudents.map((student, index) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="px-4 py-2 text-sm">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`}
                        </td>
                        <td className="px-4 py-2 text-sm font-medium text-gray-800">{student.name}</td>
                        <td className="px-4 py-2 text-sm text-center text-green-600 font-semibold">{student.ecoPoints}</td>
                        <td className="px-4 py-2 text-sm text-center text-orange-500">{student.streak}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}

          <div className="bg-white rounded-2xl shadow-xl overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Eco Points</th>
                  <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Badges Earned</th>
                  <th className="px-6 py-4 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {studentsToShow.map((student) => (
                  <tr key={student._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-green-700">{student.ecoPoints}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(student.badges || []).length > 0 ? student.badges.join(', ') : 'None'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                      <button
                        onClick={() => handleOpenAssignModal(student)}
                        className="px-3 py-1 bg-blue-500 text-white font-semibold rounded-md hover:bg-blue-600 transition text-xs"
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
      className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
      initial={{opacity: 0}} animate={{opacity: 1}} exit={{opacity: 0}}
      onClick={onClose}
    >
        <motion.div
            className="bg-white rounded-2xl p-6 w-full max-w-lg"
            initial={{scale: 0.8, y: 50}} animate={{scale: 1, y: 0}} exit={{scale: 0.8, y: 50}}
            onClick={(e) => e.stopPropagation()}
        >
            <h2 className="text-2xl font-bold mb-2">Assign Challenge</h2>
            <p className="mb-6 text-gray-600">Assign a new task to <span className="font-semibold">{student.name}</span>.</p>
            
            <div className="space-y-4">
               <div>
                 <label className="block text-sm font-medium text-gray-700 mb-1">Challenge</label>
                 <select
                   value={selectedChallengeId}
                   onChange={(e) => setSelectedChallengeId(e.target.value)}
                   className="w-full p-2 border border-gray-300 rounded-lg bg-white"
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
                 <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (Optional)</label>
                 <input 
                    type="date" 
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg"
                 />
               </div>
            </div>

            <div className="flex gap-3 mt-6">
                <button 
                    onClick={onClose}
                    className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition"
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
        className="bg-white rounded-2xl p-6 w-full max-w-xl"
        initial={{ scale: 0.8, y: 50 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.8, y: 50 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-2">Send Notification</h2>
        <p className="mb-4 text-gray-600">Notify one or all students with an update.</p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Recipient</label>
            <select
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="all">All Students</option>
              {students.map((student) => (
                <option key={student._id} value={student._id}>{student.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg bg-white"
            >
              <option value="announcement">Announcement</option>
              <option value="assignment">Assignment</option>
              <option value="challenge">Challenge</option>
              <option value="system">System</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="Enter a short title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg min-h-[120px]"
              placeholder="Type the notification message here"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Optional Link</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
              placeholder="/student/assignments or another internal path"
            />
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-800 font-semibold rounded-lg hover:bg-gray-300 transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition"
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
      className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-gray-800 text-white px-6 py-3 rounded-lg shadow-lg"
    >
      {message}
    </motion.div>
  );
}