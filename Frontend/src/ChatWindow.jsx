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

  /* 🔊 MIC WAVE STATE */
  const [waveData, setWaveData] = useState([5, 5, 5, 5, 5]);

  /* REFS */
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);
  const lastPromptRef = useRef("");

  /* AUDIO ANALYSER REFS */
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  /* ---------- SPEECH TO TEXT + MIC WAVE ---------- */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onstart = async () => {
      setListening(true);

      /* 🎧 START AUDIO ANALYSIS */
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      sourceRef.current =
        audioCtxRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(
        analyserRef.current.frequencyBinCount
      );

      sourceRef.current.connect(analyserRef.current);

      const animate = () => {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        const values = Array.from(dataArrayRef.current.slice(0, 5)).map(
          (v) => Math.max(6, v / 6)
        );
        setWaveData(values);
        rafRef.current = requestAnimationFrame(animate);
      };

      animate();
    };

    rec.onend = () => {
      setListening(false);
      cancelAnimationFrame(rafRef.current);
      audioCtxRef.current?.close();
      setWaveData([5, 5, 5, 5, 5]);
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((p) => (p ? p + " " : "") + transcript);
    };

    recognitionRef.current = rec;
  }, [setPrompt]);

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

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          message: prompt,
          threadId: currThreadId,
        }),
      });

      const data = await res.json();
      setReply(data.reply);
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }

    setPrompt("");
    setLoading(false);
  };

  const stopReply = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  /* ---------- SAVE USER MESSAGE ---------- */
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
          <div className="userAvatar">
            <i className="fa-solid fa-user"></i>
          </div>
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
            value={prompt}
            disabled={loading}
            placeholder="Ask anything"
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
              />
            </span>

            {/* 🔊 MIC WAVE */}
            {listening && (
              <div className="waveform">
                {waveData.map((h, i) => (
                  <span key={i} style={{ height: `${h}px` }} />
                ))}
              </div>
            )}

            <div id="submit" onClick={loading ? stopReply : getReply}>
              <i
                className={`fa-solid ${
                  loading ? "fa-stop" : "fa-paper-plane"
                }`}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
