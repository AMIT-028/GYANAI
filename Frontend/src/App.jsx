import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { MyContext } from "./MyContext";
import { useState } from "react";
import { v1 as uuidv1 } from "uuid";
import "highlight.js/styles/github-dark.css";

/* 🔐 PROTECTED ROUTE (PUT HERE) */
function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  if (!token) return <Navigate to="/" replace />;
  return children;
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  return (
    <MyContext.Provider
      value={{
        prompt, setPrompt,
        reply, setReply,
        currThreadId, setCurrThreadId,
        prevChats, setPrevChats,
        newChat, setNewChat,
        allThreads, setAllThreads,
      }}
    >
      <BrowserRouter>
        <Routes>

          {/* 🌍 PUBLIC ROUTE */}
          <Route path="/" element={<LandingPage />} />

          {/* 🔐 PROTECTED CHAT ROUTE */}
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <div className="chat-layout">
                  <Sidebar />
                  <ChatWindow />
                </div>
              </ProtectedRoute>
            }
          />

        </Routes>
      </BrowserRouter>
    </MyContext.Provider>
  );
}

export default App;
