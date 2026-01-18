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

  /* MIC */
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);
  const lastPromptRef = useRef("");

  /* ---------- SPEECH TO TEXT ---------- */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";

    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);

    rec.onresult = (e) =>
      setPrompt((p) => (p ? p + " " : "") + e.results[0][0].transcript);

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

          {/* FILE PREVIEW (ChatGPT style) */}
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

            <div id="submit" onClick={loading ? stopReply : getReply}>
              <i
                className={`fa-solid ${
                  loading ? "fa-stop" : "fa-paper-plane"
                }`}
              />
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
