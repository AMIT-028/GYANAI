import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";

function Chat() {
  const { newChat, prevChats, reply, setPrevChats, setPrompt } =
    useContext(MyContext);

  const [latestReply, setLatestReply] = useState("");
  const [copiedIndex, setCopiedIndex] = useState(null);
  const [speakingIndex, setSpeakingIndex] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editedText, setEditedText] = useState("");
  const bottomRef = useRef(null);

  /* ---------- WORD BY WORD STREAMING ---------- */
  useEffect(() => {
    if (!reply) return;

    let i = 0;
    const words = reply.split(" ");
    setLatestReply("");

    const interval = setInterval(() => {
      setLatestReply((prev) => prev + (prev ? " " : "") + words[i]);
      i++;

      if (i >= words.length) {
        clearInterval(interval);
        setPrevChats((prev) => [
          ...prev,
          { role: "assistant", content: reply },
        ]);
      }
    }, 35);

    return () => clearInterval(interval);
  }, [reply, setPrevChats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [latestReply, prevChats]);

  /* ---------- COPY ---------- */
  const copyText = async (text, idx) => {
    await navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 1200);
  };

  /* ---------- TEXT TO SPEECH ---------- */
  const speakText = (text, idx) => {
    if (speakingIndex === idx) {
      speechSynthesis.cancel();
      setSpeakingIndex(null);
      return;
    }

    speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.onend = () => setSpeakingIndex(null);
    setSpeakingIndex(idx);
    speechSynthesis.speak(u);
  };

  /* ---------- EDIT ---------- */
  const submitEdit = (idx) => {
    const updated = [...prevChats];
    updated[idx] = { role: "user", content: editedText };

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
          <div key={idx} className={chat.role === "user" ? "userDiv" : "gptDiv"}>
            <div className="messageBlock">
              {chat.role === "user" ? (
                editingIndex === idx ? (
                  <input
                    value={editedText}
                    autoFocus
                    onChange={(e) => setEditedText(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && submitEdit(idx)}
                  />
                ) : (
                  <div className="userMessage">{chat.content}</div>
                )
              ) : (
                <div className="gptMessage">
                  <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                    {chat.content}
                  </ReactMarkdown>
                </div>
              )}

              <div className="messageActions">
                <span onClick={() => copyText(chat.content, idx)}>
                  <i
                    className={`fa-solid ${
                      copiedIndex === idx ? "fa-check" : "fa-copy"
                    }`}
                  ></i>
                </span>

                {chat.role === "assistant" && (
                  <span onClick={() => speakText(chat.content, idx)}>
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
                    onClick={() => {
                      setEditingIndex(idx);
                      setEditedText(chat.content);
                    }}
                  >
                    <i className="fa-solid fa-pen"></i>
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}

        {reply && (
          <div className="gptDiv">
            <div className="gptMessage">{latestReply}</div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </>
  );
}

export default Chat;
