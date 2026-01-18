const express = require("express");
const Thread = require("../models/Thread");
const router = express.Router();
const getOpenAIAPIResponse = require("../utils/openai");

const multer = require("multer");
const pdf = require("pdf-parse");
const mammoth = require("mammoth");
const Tesseract = require("tesseract.js");
const fs = require("fs");

const upload = multer({ dest: "uploads/" });

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



router.post("/chat", upload.single("file"), async (req, res) => {
  try {
    const { threadId, message } = req.body;
    let extractedText = "";

    if (!threadId || (!message && !req.file)) {
      return res.status(400).json({ error: "Missing input" });
    }

    /* ---------- FILE PARSING (OPTIONAL) ---------- */
    if (req.file) {
      const filePath = req.file.path;
      const mime = req.file.mimetype;

      try {
        if (mime === "application/pdf") {
          const data = await pdf(fs.readFileSync(filePath));
          extractedText = data.text;
        }
        else if (mime.includes("word")) {
          const result = await mammoth.extractRawText({ path: filePath });
          extractedText = result.value;
        }
        else if (mime.startsWith("image/")) {
          const { data } = await Tesseract.recognize(filePath, "eng");
          extractedText = data.text;
        }
      } finally {
        /* 🔥 ALWAYS CLEAN UP FILE */
        fs.unlinkSync(filePath);
      }
    }

    /* ---------- FINAL PROMPT (UNCHANGED LOGIC) ---------- */
    const finalPrompt = `
User message:
${message || ""}

File content:
${extractedText || "No file"}
`;

    /* ---------- THREAD HANDLING (UNCHANGED) ---------- */
    let thread = await Thread.findOne({ threadId });

    if (!thread) {
      thread = new Thread({
        threadId,
        title: message || "File Chat",
        messages: [],
      });
    }

    thread.messages.push({
      role: "user",
      content: message || "[File uploaded]",
    });

    const reply = await getOpenAIAPIResponse(finalPrompt);

    thread.messages.push({
      role: "assistant",
      content: reply,
    });

    thread.updatedAt = new Date();
    await thread.save();

    res.json({ reply });

  } catch (err) {
    console.error("CHAT ERROR:", err);
    res.status(500).json({ error: "Chat processing failed" });
  }
});

module.exports = router;
