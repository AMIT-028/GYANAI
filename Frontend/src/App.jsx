import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "./pages/LandingPage";
import Sidebar from "./Sidebar";
import ChatWindow from "./ChatWindow";
import { MyContext } from "./MyContext";
import { useState } from "react";
import { v1 as uuidv1 } from "uuid";
import AuthModal from "./components/AuthModal";

function ProtectedRoute({ children }) {
  const token = localStorage.getItem("token");
  return token ? children : <Navigate to="/" replace />;
}

function App() {
  const [prompt, setPrompt] = useState("");
  const [reply, setReply] = useState(null);
  const [currThreadId, setCurrThreadId] = useState(uuidv1());
  const [prevChats, setPrevChats] = useState([]);
  const [newChat, setNewChat] = useState(true);
  const [allThreads, setAllThreads] = useState([]);

  const [authType, setAuthType] = useState(null); // 👈 MOVED HERE

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
          <Route
            path="/"
            element={
              <LandingPage
                onLogin={() => setAuthType("login")}
                onSignup={() => setAuthType("signup")}
              />
            }
          />

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

        {/* ✅ MODAL INSIDE ROUTER */}
        {authType && (
          <AuthModal
            type={authType}
            onClose={() => setAuthType(null)}
          />
        )}
      </BrowserRouter>
    </MyContext.Provider>
  );
}

export default App;
