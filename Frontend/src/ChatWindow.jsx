import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

function ChatWindow() {
  const {
    prompt,
    setPrompt,
    reply,
    setReply,
    currThreadId,
    setPrevChats,
    setNewChat,
  } = useContext(MyContext);

  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [listening, setListening] = useState(false);
  const [waveData, setWaveData] = useState([5, 5, 5, 5, 5]);

  const recognitionRef = useRef(null);
  const lastPromptRef = useRef("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  /* ---------- SPEECH TO TEXT (INPUT MIC) ---------- */
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => setListening(true);
    recognition.onend = () => setListening(false);

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((p) => (p ? p + " " + transcript : transcript));
    };

    recognitionRef.current = recognition;
  }, []);

  const startListening = () => {
    if (!listening) recognitionRef.current?.start();
  };

  const stopListening = () => {
    if (listening) recognitionRef.current?.stop();
  };

  /* ---------- SEND MESSAGE ---------- */
  const getReply = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setNewChat(false);
    lastPromptRef.current = prompt;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          threadId: currThreadId,
        }),
      });

      const data = await res.json();
      setReply(data.reply);
    } catch (err) {
      console.error(err);
    }

    setPrompt("");
    setLoading(false);
  };

  /* ---------- SAVE USER MESSAGE ONLY ---------- */
  useEffect(() => {
    if (!reply) return;

    setPrevChats((prev) => [
      ...prev,
      { role: "user", content: lastPromptRef.current },
    ]);
  }, [reply, setPrevChats]);

  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>GYANAI</span>
        <div className="userIconDiv" onClick={() => setIsOpen(!isOpen)}>
          <i className="fa-solid fa-user"></i>
        </div>
      </div>

      {isOpen && (
        <div className="dropDown">
          <div className="dropDownItem">Settings</div>
          <div className="dropDownItem">Upgrade plan</div>
          <div className="dropDownItem" onClick={handleLogout}>
            Log out
          </div>
        </div>
      )}

      <Chat />

      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          <input
            disabled={loading}
            type="text"
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getReply()}
          />

          <div className="actionBtns">
            <span
              className={`micBtn ${listening ? "listening" : ""}`}
              onClick={listening ? stopListening : startListening}
            >
              <i
                className={`fa-solid ${
                  listening ? "fa-microphone-slash" : "fa-microphone"
                }`}
              ></i>
            </span>

            <div id="submit" onClick={getReply}>
              <i className="fa-solid fa-paper-plane"></i>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
