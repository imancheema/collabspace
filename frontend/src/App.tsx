import React, { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./screens/Dashboard";
import TextEditor from "./screens/TextEditor";
import Login from "./screens/Login";
import Register from "./screens/Register";
import CourseSpace from "./screens/CourseSpace";
import "./App.css";

const App: React.FC = () => {
  const [isAuthed, setIsAuthed] = useState<boolean>(
    () => !!localStorage.getItem("token")
  );

  const handleLogin = () => setIsAuthed(true);
  const handleLogout = () => setIsAuthed(false);

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={
            isAuthed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/login"
          element={
            isAuthed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login onLogin={handleLogin} />
            )
          }
        />
        <Route
          path="/register"
          element={
            isAuthed ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register onRegister={handleLogin} />
            )
          }
        />
        <Route
          path="/dashboard"
          element={
            isAuthed ? (
              <Dashboard onSignOut={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/course/:groupCode"
          element={
            isAuthed ? (
              <CourseSpace onSignOut={handleLogout} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/group/:groupId/text-editor/:documentId" //Path requires groupId and documentId
          element={isAuthed ? <TextEditor /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
