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
  const [listening, setListening] = useState(false);

  /* FILE STATE */
  const [file, setFile] = useState(null);
  const fileInputRef = useRef(null);

  /* MIC WAVE STATE */
  const [waveData, setWaveData] = useState([6, 6, 6, 6, 6]);

  /* REFS */
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);
  const lastPromptRef = useRef("");

  /* AUDIO ANALYSER REFS (MIC WAVE FIX) */
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);

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

      // 🎧 MIC WAVE SETUP (THIS WAS MISSING BEFORE)
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
      setWaveData([6, 6, 6, 6, 6]);
    };

    rec.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setPrompt((p) => (p ? p + " " : "") + transcript);
    };

    recognitionRef.current = rec;
  }, [setPrompt]);

  /* ---------- FILE PICK ---------- */
  const handleFileSelect = (e) => {
    const selected = e.target.files[0];
    if (selected) setFile(selected);
  };

  /* ---------- SEND MESSAGE ---------- */
  const getReply = async () => {
    if (!prompt.trim() && !file) return;

    setLoading(true);
    setNewChat(false);
    lastPromptRef.current = prompt;

    abortRef.current = new AbortController();

    try {
      const formData = new FormData();
      formData.append("message", prompt);
      formData.append("threadId", currThreadId);
      if (file) formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        body: formData,
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      setReply(data.reply);
    } catch (err) {
      if (err.name !== "AbortError") console.error(err);
    }

    setPrompt("");
    setFile(null);
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
      <Chat />

      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          {/* FILE PREVIEW */}
          {file && (
            <div className="filePreview">
              <span>{file.name}</span>
              <button onClick={() => setFile(null)}>✕</button>
            </div>
          )}

          {/* ATTACH BUTTON */}
          <span
            className="attachBtn"
            onClick={() => fileInputRef.current.click()}
          >
            +
          </span>

          <input
            value={prompt}
            disabled={loading}
            placeholder="Ask anything"
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getReply()}
          />

          <div className="actionBtns">
            {/* MIC */}
            <span
              className={`micBtn ${listening ? "listening" : ""}`}
              onClick={() =>
                listening
                  ? recognitionRef.current.stop()
                  : recognitionRef.current.start()
              }
            >
              <i
                className={`fa-solid ${
                  listening ? "fa-microphone-slash" : "fa-microphone"
                }`}
              />
            </span>

            {/* 🔊 MIC WAVE (FIXED) */}
            {listening && (
              <div className="waveform">
                {waveData.map((h, i) => (
                  <span key={i} style={{ height: `${h}px` }} />
                ))}
              </div>
            )}

            {/* SEND / STOP */}
            <div id="submit" onClick={loading ? stopReply : getReply}>
              <i
                className={`fa-solid ${
                  loading ? "fa-stop" : "fa-paper-plane"
                }`}
              />
            </div>
          </div>

          {/* HIDDEN FILE INPUT */}
          <input
            ref={fileInputRef}
            type="file"
            hidden
            accept=".pdf,.csv,.docx,.ppt,.pptx,.png,.jpg,.jpeg"
            onChange={handleFileSelect}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
