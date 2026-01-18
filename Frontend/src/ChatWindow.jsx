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

  /* MIC WAVE */
  const [waveData, setWaveData] = useState([6, 6, 6, 6, 6]);

  /* REFS */
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);
  const lastPromptRef = useRef("");

  /* AUDIO */
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const dataArrayRef = useRef(null);
  const sourceRef = useRef(null);
  const rafRef = useRef(null);

  /* ---------- SPEECH TO TEXT + WAVE ---------- */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";

    rec.onstart = async () => {
      setListening(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      audioCtxRef.current = new AudioContext();
      analyserRef.current = audioCtxRef.current.createAnalyser();
      sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);

      analyserRef.current.fftSize = 256;
      dataArrayRef.current = new Uint8Array(analyserRef.current.frequencyBinCount);
      sourceRef.current.connect(analyserRef.current);

      const animate = () => {
        analyserRef.current.getByteFrequencyData(dataArrayRef.current);
        setWaveData(
          Array.from(dataArrayRef.current.slice(0, 5)).map(v => Math.max(6, v / 6))
        );
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

    rec.onresult = e => {
      const text = e.results[0][0].transcript;
      setPrompt(p => (p ? p + " " : "") + text);
    };

    recognitionRef.current = rec;
  }, [setPrompt]);

  /* ---------- FILE PICK ---------- */
  const handleFileSelect = e => {
    const f = e.target.files[0];
    if (f) setFile(f);
  };

  /* ---------- SEND ---------- */
  const getReply = async () => {
    if (!prompt.trim() && !file) return;

    setLoading(true);
    setNewChat(false);
    lastPromptRef.current = prompt;

    abortRef.current = new AbortController();

    try {
      const fd = new FormData();
      fd.append("message", prompt);
      fd.append("threadId", currThreadId);
      if (file) fd.append("file", file);

      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        body: fd,
        signal: abortRef.current.signal,
      });

      const data = await res.json();
      setReply(data.reply);
    } catch (e) {
      if (e.name !== "AbortError") console.error(e);
    }

    setPrompt("");
    setFile(null);
    setLoading(false);
  };

  const stopReply = () => {
    abortRef.current?.abort();
    setLoading(false);
  };

  /* ---------- SAVE USER MSG ---------- */
  useEffect(() => {
    if (!reply) return;
    setPrevChats(p => [...p, { role: "user", content: lastPromptRef.current }]);
  }, [reply, setPrevChats]);

  const isImage = file?.type.startsWith("image/");

  return (
    <div className="chatWindow">
      <Chat />
      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">

          {/* FILE CHIP (FIXED) */}
          {file && (
            <div className="fileChip">
              {isImage ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt="preview"
                  className="fileThumb"
                />
              ) : (
                <span className="fileIcon">📄</span>
              )}
              <span className="fileName">{file.name}</span>
              <span className="removeFile" onClick={() => setFile(null)}>✕</span>
            </div>
          )}

          {/* ATTACH */}
          <span className="attachBtn" onClick={() => fileInputRef.current.click()}>
            +
          </span>

          <input
            value={prompt}
            disabled={loading}
            placeholder="Ask anything"
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === "Enter" && getReply()}
          />

          <div className="actionBtns">
            <span
              className={`micBtn ${listening ? "listening" : ""}`}
              onClick={() =>
                listening
                  ? recognitionRef.current.stop()
                  : recognitionRef.current.start()
              }
            >
              <i className={`fa-solid ${listening ? "fa-microphone-slash" : "fa-microphone"}`} />
            </span>

            {listening && (
              <div className="waveform">
                {waveData.map((h, i) => (
                  <span key={i} style={{ height: `${h}px` }} />
                ))}
              </div>
            )}

            <div id="submit" onClick={loading ? stopReply : getReply}>
              <i className={`fa-solid ${loading ? "fa-stop" : "fa-paper-plane"}`} />
            </div>
          </div>

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
