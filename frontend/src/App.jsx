import React, { Suspense } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";

// Auth pages
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";

// Protected pages
import Dashboard from "./pages/Dashboard";
import ProblemStatement from "./pages/ProblemStatement";
import Leaderboard from "./pages/Leaderboard";
import TeacherPanel from "./pages/TeacherPanel";
import AdminPanel from "./pages/AdminPanel";
import LessonsPage from "./pages/LessonsPage";
import LessonViewer from "./pages/LessonViewer";
import ManageLessons from "./components/ManageLessons";
import VideoPlayer from "./components/VideoPlayer";
import GamePlayer from "./components/GamePlayer";
import CarbonTracker from "./pages/CarbonTracker";
import GreenGridSandbox from "./components/GreenGridSandbox";
import CarbonCaptureSandbox from "./components/CarbonCaptureSandbox";
import BioreactorSandbox from "./components/BioreactorSandbox";

// --- Auth Gate Helpers ---
function isAuthed() {
  return localStorage.getItem("isLoggedIn") === "true";
}

function getUserRole() {
  return localStorage.getItem("role");
}

function PrivateRoute({ children }) {
  return isAuthed() ? children : <Navigate to="/" replace />;
}

function TeacherRoute({ children }) {
  const authed = isAuthed();
  const role = getUserRole();
  return authed && role === "teacher" ? children : <Navigate to="/dashboard" replace />;
}

function AdminRoute({ children }) {
  const authed = isAuthed();
  const role = getUserRole();
  return authed && role === "admin" ? children : <Navigate to="/dashboard" replace />;
}

function TeacherAdminRoute({ children }) {
  const authed = isAuthed();
  const role = getUserRole();
  return authed && (role === "teacher" || role === "admin") ? children : <Navigate to="/dashboard" replace />;
}


export default function App() {
  return (
    <Router>
      <Suspense fallback={<div style={{ padding: 24 }}>Loading…</div>}>
        <Routes>
          {/* Auth routes */}
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />

          {/* Protected routes */}
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/problem-statement"
            element={
              <PrivateRoute>
                <ProblemStatement />
              </PrivateRoute>
            }
          />
          <Route
            path="/leaderboard"
            element={
              <PrivateRoute>
                <Leaderboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/carbon-tracker"
            element={
              <PrivateRoute>
                <CarbonTracker />
              </PrivateRoute>
            }
          />
          <Route
            path="/grid-simulator"
            element={
              <PrivateRoute>
                <GreenGridSandbox />
              </PrivateRoute>
            }
          />
          <Route
            path="/dac-simulator"
            element={
              <PrivateRoute>
                <CarbonCaptureSandbox />
              </PrivateRoute>
            }
          />
          <Route
            path="/bioreactor-simulator"
            element={
              <PrivateRoute>
                <BioreactorSandbox />
              </PrivateRoute>
            }
          />
          <Route
            path="/bioreactor-simulator"
            element={
              <PrivateRoute>
                <BioreactorSandbox />
              </PrivateRoute>
            }
          />
          <Route
            path="/teacher-panel"
            element={
              <TeacherRoute>
                <TeacherPanel />
              </TeacherRoute>
            }
          />
          <Route
            path="/admin-panel"
            element={
              <AdminRoute>
                <AdminPanel />
              </AdminRoute>
            }
          />
          
          <Route
            path="/learn/lessons"
            element={
              <PrivateRoute>
                <LessonsPage />
              </PrivateRoute>
            }
          />
          <Route
            path="/learn/video/:id"
            element={
              <PrivateRoute>
                <VideoPlayer />
              </PrivateRoute>
            }
          />
          <Route
            path="/learn/games/:id"
            element={
              <PrivateRoute>
                <GamePlayer />
              </PrivateRoute>
            }
          />
          
          {/* ✅ REMOVED: The hardcoded route for RecycleRush is no longer needed */}
          
          <Route
            path="/learn/lesson/:id"
            element={
              <PrivateRoute>
                <LessonViewer />
              </PrivateRoute>
            }
          />
          
          <Route
            path="/manage-lessons"
            element={
              <TeacherAdminRoute>
                <ManageLessons />
              </TeacherAdminRoute>
            }
          />

          <Route
            path="/home"
            element={<Navigate to={isAuthed() ? "/dashboard" : "/"} replace />}
          />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Router>
  );
}

function NotFound() {
  return (
    <div style={{
      minHeight: "100vh",
      display: "grid",
      placeItems: "center",
      fontFamily: "Inter, system-ui, Arial, sans-serif"
    }}>
      <div style={{ textAlign: "center" }}>
        <h1 style={{ margin: 0 }}>404</h1>
        <p>Page not found.</p>
        <a href={isAuthed() ? "/dashboard" : "/"}>Go back</a>
      </div>
    </div>
  );
}
