const express = require("express");
const Thread = require("../models/Thread");
const router = express.Router();
const getOpenAIAPIResponse = require("../utils/openai");

/* ---------- THREAD ROUTES ---------- */

router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({}).sort({ updatedAt: -1 });
    res.json(threads);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});

router.get("/thread/:threadId", async (req, res) => {
  try {
    const thread = await Thread.findOne({ threadId: req.params.threadId });
    if (!thread) return res.status(404).json({ error: "Thread not found" });
    res.json(thread.messages);
  } catch {
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

router.delete("/thread/:threadId", async (req, res) => {
  try {
    await Thread.findOneAndDelete({ threadId: req.params.threadId });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

/* ---------- CHAT ROUTE ---------- */

router.post("/chat", async (req, res) => {
  const { threadId, message, extractedText } = req.body;

  if (!threadId || (!message && !extractedText)) {
    return res.status(400).json({ error: "Missing input" });
  }

  const finalPrompt = `
User message:
${message || ""}

File content:
${extractedText || "No file"}
`;

  let thread = await Thread.findOne({ threadId });

  if (!thread) {
    thread = new Thread({
      threadId,
      title: message || "File Chat",
      messages: [],
    });
  }

  thread.messages.push({ role: "user", content: message || "[File uploaded]" });

  const reply = await getOpenAIAPIResponse(finalPrompt);

  thread.messages.push({ role: "assistant", content: reply });
  thread.updatedAt = new Date();

  await thread.save();

  res.json({ reply });
});

module.exports = router;
