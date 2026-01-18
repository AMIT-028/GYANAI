import "./Chat.css";
import React, { useContext, useState, useEffect, useRef } from "react";
import { MyContext } from "./MyContext";
import ReactMarkdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

function Chat() {
  const { newChat, prevChats, reply, setPrevChats } =
    useContext(MyContext);

  const [latestReply, setLatestReply] = useState("");
  const bottomRef = useRef(null);

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
              <div className={chat.role === "user" ? "userMessage" : "gptMessage"}>
                <ReactMarkdown rehypePlugins={[rehypeHighlight]}>
                  {chat.content}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        ))}

        {reply && (
          <div className="gptDiv">
            <div className="messageBlock">
              <div className="gptMessage">
                <ReactMarkdown>{latestReply}</ReactMarkdown>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>
    </>
  );
}

export default Chat;
