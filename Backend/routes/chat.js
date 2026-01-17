const express = require("express");
const Thread = require("../models/Thread");
const router = express.Router();
const getOpenAIAPIResponse = require("../utils/openai");

const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Tesseract = require("tesseract.js");
const officeParser = require("officeparser");
const { parse } = require("csv-parse/sync");




// test route
router.post("/test", async (req, res) => {
  try {
    const thread = new Thread({
      threadId: "abc",
      title: "Testing New Thread2",
    });

    const response = await thread.save();
    res.send(response);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save in DB" });
  }
});
router.get("/thread", async (req, res) => {
  try {
    const threads = await Thread.find({}).sort({ updatedAt: -1 });
    //descending order of updatedAt...most recent data on top
    res.json(threads);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch threads" });
  }
});
router.get("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const thread = await Thread.findOne({ threadId });

    if (!thread) {
      res.status(404).json({ error: "Thread not found" });
    }

    res.json(thread.messages);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to fetch chat" });
  }
});

router.delete("/thread/:threadId", async (req, res) => {
  const { threadId } = req.params;

  try {
    const deletedThread = await Thread.findOneAndDelete({ threadId });

    if (!deletedThread) {
      res.status(404).json({ error: "Thread not found" });
    }

    res.status(200).json({ success: "Thread deleted successfully" });
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: "Failed to delete thread" });
  }
});

router.post("/chat", async (req, res) => {
  const { threadId, message, file } = req.body;

  if (!threadId || (!message && !file)) {
    return res.status(400).json({ error: "Missing fields" });
  }

  try {
    let extractedText = "";
    let thumbnail = null;

    if (file?.path) {
      const filePath = path.join(__dirname, "..", file.path);

      // PDF
      if (file.mimetype === "application/pdf") {
        const buffer = fs.readFileSync(filePath);
        const pdf = await pdfParse(buffer);
        extractedText = pdf.text;

        // thumbnail
        const thumbDir = path.join("uploads", "thumbnails");
        if (!fs.existsSync(thumbDir)) fs.mkdirSync(thumbDir, { recursive: true });

        
        thumbnail = `/uploads/thumbnails/${file.filename}-1.png`;
      }

      // IMAGE OCR
      else if (file.mimetype.startsWith("image/")) {
        const ocr = await Tesseract.recognize(filePath, "eng");
        extractedText = ocr.data.text;
      }

      // CSV
      else if (file.mimetype === "text/csv") {
        const csvData = fs.readFileSync(filePath);
        const records = parse(csvData);
        extractedText = JSON.stringify(records.slice(0, 20));
      }

      // PPT / DOCX
      else {
        extractedText = await officeParser.parseOfficeAsync(filePath);
      }
    }

    const finalPrompt = `
User message:
${message || ""}

File content:
${extractedText || "No file"}
`;

    let thread = await Thread.findOne({ threadId });

    const userMessage = {
      role: "user",
      content: message || "[File uploaded]",
      file: {
        ...file,
        thumbnail,
      },
    };

    if (!thread) {
      thread = new Thread({
        threadId,
        title: message || "File Chat",
        messages: [userMessage],
      });
    } else {
      thread.messages.push(userMessage);
    }

    const reply = await getOpenAIAPIResponse(finalPrompt);

    thread.messages.push({ role: "assistant", content: reply });
    thread.updatedAt = new Date();

    await thread.save();

    res.json({ reply });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Chat failed" });
  }
});

module.exports = router;
