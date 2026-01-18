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
  const result = await mammoth.extractRawText({ arrayBuffer: buffer });
  return result.value;
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
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);

  const fileInputRef = useRef(null);
  const lastPromptRef = useRef("");

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setSelectedFile({
      name: file.name,
      type: file.type,
      previewUrl: file.type.startsWith("image/")
        ? URL.createObjectURL(file)
        : null,
      rawFile: file,
    });
  };

  const getReply = async () => {
    if (!prompt.trim() && !selectedFile) return;

    setLoading(true);
    setNewChat(false);

    let extractedText = "";

    if (selectedFile?.rawFile) {
      extractedText = await extractTextFromFile(selectedFile.rawFile);
    }

    lastPromptRef.current = prompt;

    try {
      const res = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          threadId: currThreadId,
          message: prompt,
          extractedText,
        }),
      });

      const data = await res.json();
      setReply(data.reply);
    } catch (err) {
      console.error(err);
    }

    setPrompt("");
    setSelectedFile(null);
    setLoading(false);
  };

  useEffect(() => {
    if (!reply) return;

    setPrevChats((prev) => [
      ...prev,
      { role: "user", content: lastPromptRef.current },
      { role: "assistant", content: reply },
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

          {selectedFile && (
            <div className="fileChip">
              {selectedFile.previewUrl ? (
                <img src={selectedFile.previewUrl} className="fileThumb" />
              ) : (
                <span className="fileIcon">📄</span>
              )}
              <span className="fileName">{selectedFile.name}</span>
              <span className="removeFile" onClick={() => setSelectedFile(null)}>
                ✕
              </span>
            </div>
          )}

          <input
            disabled={loading}
            type="text"
            placeholder="Ask anything"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && getReply()}
          />

          <div id="submit" onClick={getReply}>
            <i className="fa-solid fa-paper-plane"></i>
          </div>

          <input
            type="file"
            hidden
            ref={fileInputRef}
            onChange={handleFileUpload}
          />
        </div>

        <p className="info">GYANAI can make mistakes. Check important info.</p>
      </div>
    </div>
  );
}

export default ChatWindow;
