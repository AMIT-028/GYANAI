import "./ChatWindow.css";
import Chat from "./Chat.jsx";
import { MyContext } from "./MyContext.jsx";
import { useContext, useState, useEffect, useRef } from "react";
import { ScaleLoader } from "react-spinners";

import Papa from "papaparse";
import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";
import Tesseract from "tesseract.js";

const API_BASE = import.meta.env.VITE_API_BASE_URL;

/* ---------- FILE PARSERS ---------- */
const parseCSV = (file) =>
  new Promise((resolve) => {
    Papa.parse(file, {
      complete: (res) => resolve(JSON.stringify(res.data.slice(0, 20))),
    });
  });

const parsePDF = async (file) => {
  const buffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
  let text = "";
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it) => it.str).join(" ");
  }
  return text;
};

const parseDOCX = async (file) => {
  const buffer = await file.arrayBuffer();
  const res = await mammoth.extractRawText({ arrayBuffer: buffer });
  return res.value;
};

const parseImage = async (file) => {
  const { data } = await Tesseract.recognize(file, "eng");
  return data.text;
};

const extractTextFromFile = async (file) => {
  if (file.type === "text/csv") return parseCSV(file);
  if (file.type === "application/pdf") return parsePDF(file);
  if (file.type.includes("word")) return parseDOCX(file);
  if (file.type.startsWith("image/")) return parseImage(file);
  return "";
};

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
  const [waveData, setWaveData] = useState([5, 5, 5, 5, 5]);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);
  const abortRef = useRef(null);
  const lastPromptRef = useRef("");

  /* ---------- MIC + WAVEFORM ---------- */
  useEffect(() => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;

    const rec = new SR();
    rec.lang = "en-US";

    rec.onstart = async () => {
      setListening(true);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const audioCtx = new AudioContext();
      const analyser = audioCtx.createAnalyser();
      const src = audioCtx.createMediaStreamSource(stream);
      src.connect(analyser);
      analyser.fftSize = 256;
      const data = new Uint8Array(analyser.frequencyBinCount);

      const animate = () => {
        analyser.getByteFrequencyData(data);
        setWaveData([...data.slice(0, 5)].map((v) => Math.max(6, v / 6)));
        if (listening) requestAnimationFrame(animate);
      };
      animate();
    };

    rec.onend = () => {
      setListening(false);
      setWaveData([5, 5, 5, 5, 5]);
    };

    rec.onresult = (e) =>
      setPrompt((p) => p + " " + e.results[0][0].transcript);

    recognitionRef.current = rec;
  }, []);

  /* ---------- FILE UPLOAD ---------- */
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setSelectedFile(file);
  };

  /* ---------- SEND MESSAGE ---------- */
  const getReply = async () => {
    if (!prompt.trim() && !selectedFile) return;

    setLoading(true);
    setNewChat(false);
    lastPromptRef.current = prompt;

    let extractedText = "";
    if (selectedFile) {
      extractedText = await extractTextFromFile(selectedFile);
    }

    abortRef.current = new AbortController();

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: abortRef.current.signal,
        body: JSON.stringify({
          message: prompt,
          context: extractedText,
          threadId: currThreadId,
        }),
      });

      const data = await res.json();
      setReply(data.reply);
    } catch (e) {}

    setPrompt("");
    setSelectedFile(null);
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
  }, [reply]);

  return (
    <div className="chatWindow">
      <Chat />

      <ScaleLoader color="#fff" loading={loading} />

      <div className="chatInput">
        <div className="inputBox">
          {/* FILE PREVIEW */}
          {selectedFile && (
            <div className="filePreview">
              <span>{selectedFile.name}</span>
              <button onClick={() => setSelectedFile(null)}>✕</button>
            </div>
          )}

          <span className="attachBtn" onClick={() => fileInputRef.current.click()}>
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
              <i className={`fa-solid ${listening ? "fa-microphone-slash" : "fa-microphone"}`} />
            </span>

            <div id="submit" onClick={loading ? stopReply : getReply}>
              <i className={`fa-solid ${loading ? "fa-stop" : "fa-paper-plane"}`} />
            </div>
          </div>

          <input
            type="file"
            hidden
            ref={fileInputRef}
            accept=".pdf,.csv,.docx,.png,.jpg,.jpeg"
            onChange={handleFileUpload}
          />
        </div>
      </div>
    </div>
  );
}

export default ChatWindow;
