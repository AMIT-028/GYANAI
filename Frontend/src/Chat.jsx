import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
  const { newChat, prevChats, reply, setPrompt, setPrevChats } =
    useContext(MyContext);

  const [latestReply, setLatestReply] = useState(null);
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!reply) {
      setLatestReply(null);
      return;
    }

    let i = 0;
    const words = reply.split(" ");
    setLatestReply("");

    const interval = setInterval(() => {
      setLatestReply((prev) => prev + (prev ? " " : "") + words[i]);
      i++;
      if (i >= words.length) clearInterval(interval);
    }, 35);

    return () => clearInterval(interval);
  }, [reply]);
  const isNearBottom = () => {
    const el = document.querySelector(".chats");
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  useEffect(() => {
    if (!isNearBottom()) return;
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [latestReply, prevChats]);

  const copyText = async (text, idx) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(idx);
      setTimeout(() => setCopiedIndex(null), 1200);
    } catch {}
  };

  const speakText = (text, idx) => {
    if (speakingIndex === idx) {
      window.speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onend = () => setSpeakingIndex(null);

    setSpeakingIndex(idx);
    window.speechSynthesis.speak(utterance);
  };

  const startEdit = (idx, text) => {
    setEditingIndex(idx);
    setEditedText(text);
  };

  const submitEdit = (idx) => {
    const updated = [...prevChats];

    updated[idx] = {
      role: "user",
      content: editedText,
    };

    if (updated[idx + 1]?.role === "assistant") {
      updated.splice(idx + 1, 1);
    }

    setPrevChats(updated);
    setPrompt(editedText);
    setEditingIndex(null);
  };

  return (
    <>
      {newChat && <h1 className="newChatTitle">Start a New Chat!</h1>}

      <div className="chats">
        {prevChats.map((chat, idx) => (
          <div
            key={idx}
            className={chat.role === "user" ? "userDiv" : "gptDiv"}
          >
            <div className="messageBlock">
              {chat.role === "user" ? (
                <div className="userMessage">
                  {editingIndex === idx ? (
                    <input
                      className="editInput"
                      value={editedText}
                      autoFocus
                      onChange={(e) => setEditedText(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && submitEdit(idx)}
                    />
                  ) : (
                    <div className="chatText">{chat.content}</div>
                  )}
                </div>
              ) : (
                <div className="gptMessage">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {chat.content}
                  </ReactMarkdown>
                </div>
              )}

              <div className="messageActions">
                <span
                  className="copyBtn"
                  onClick={() => copyText(chat.content, idx)}
                >
                  {copiedIndex === idx ? (
                    <i className="fa-solid fa-check"></i>
                  ) : (
                    <i className="fa-solid fa-copy"></i>
                  )}
                </span>

                {chat.role === "assistant" && (
                  <span
                    className="copyBtn"
                    onClick={() => speakText(chat.content, idx)}
                  >
                    <i
                      className={`fa-solid ${
                        speakingIndex === idx
                          ? "fa-volume-xmark"
                          : "fa-volume-high"
                      }`}
                    ></i>
                  </span>
                )}

                {chat.role === "user" && (
                  <span
                    className="copyBtn"
                    onClick={() => startEdit(idx, chat.content)}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        <div ref={bottomRef} />
      </div>
    </>
  );
}

export default Chat;
