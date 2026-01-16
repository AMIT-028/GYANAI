import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";
import axios from "axios";

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
  const [selectedFile, setSelectedFile] = useState(null);
  const [listening, setListening] = useState(false);
  const [waveData, setWaveData] = useState([5, 5, 5, 5, 5]);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastPromptRef = useRef("");
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = async () => {
      setListening(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      sourceRef.current =
        audioContextRef.current.createMediaStreamSource(stream);

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

    recognition.onend = () => {
      setListening(false);
      cancelAnimationFrame(rafRef.current);
      audioContextRef.current?.close();
      setWaveData([5, 5, 5, 5, 5]);
      setTimeout(() => {
        if (prompt.trim()) getReply();
      }, 300);
    };

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((p) => (p ? p + " " + transcript : transcript));
    };

    recognition.onerror = () => {
      setListening(false);
      cancelAnimationFrame(rafRef.current);
    };

    recognitionRef.current = recognition;
  }, [prompt]);

  const startListening = () => {
    if (!listening) recognitionRef.current?.start();
  };

  const stopListening = () => {
    if (listening) recognitionRef.current?.stop();
  };

  const getReply = async () => {
    if (!prompt.trim() && !selectedFile) return;

    setLoading(true);
    setNewChat(false);

    lastPromptRef.current = {
      text: prompt,
      file: selectedFile,
    };

    abortControllerRef.current = new AbortController();

    try {
      const res = await fetch("http://localhost:3000/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: prompt,
          threadId: currThreadId,
          file: selectedFile,
        }),
        signal: abortControllerRef.current.signal,
      });

      const data = await res.json();
      setReply(data.reply);
    } catch {}

    setPrompt("");
    setSelectedFile(null);
    setLoading(false);
  };

  const stopReply = () => {
    abortControllerRef.current?.abort();
    setLoading(false);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const res = await axios.post(
        "http://localhost:3000/api/files/upload",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setSelectedFile(res.data.file);
    } catch {}
  };

 useEffect(() => {
  if (!reply) return;

  setPrevChats(prev => [
    ...prev,
    { role: "user", content: lastPromptRef.current.text },
    { role: "assistant", content: reply }
  ]);
}, [reply, setPrevChats]);


  return (
    <div className="chatWindow">
      <div className="navbar">
        <span>GYANAI</span>
        <div className="userIconDiv" onClick={() => setIsOpen(!isOpen)}>
          <span className="userIcon">
            <i className="fa-solid fa-user"></i>
          </span>
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
          <span className="attachBtn" onClick={() => fileInputRef.current.click()}>
            +
          </span>

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

            {listening && (
              <div className="waveform">
                {waveData.map((h, i) => (
                  <span key={i} style={{ height: `${h}px` }} />
                ))}
              </div>
            )}

            <div id="submit" onClick={loading ? stopReply : getReply}>
              {loading ? (
                <i className="fa-solid fa-stop"></i>
              ) : (
                <i className="fa-solid fa-paper-plane"></i>
              )}
            </div>
          </div>

          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>

        <p className="info">
          GYANAI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
}

export default ChatWindow;
