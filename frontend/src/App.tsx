import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./screens/Dashboard";
import TipTap from "./screens/TextEditor";
import "./App.css";

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/text-editor" element={<TipTap />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
