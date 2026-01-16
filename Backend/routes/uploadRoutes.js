const express = require("express");
const protect = require("../middlewares/authMiddleware");
const upload = require("../middlewares/uploadMiddleware");


const router = express.Router();

router.post(
  "/upload",
  protect,
  upload.single("file"),
  (req, res) => {

    // 🔴 SAFETY CHECK
    if (!req.file) {
      return res.status(400).json({
        message: "No file received. Check multipart form & key name.",
      });
    }

    res.json({
      message: "File uploaded successfully",
      file: {
        filename: req.file.filename,
        path: req.file.path,
        mimetype: req.file.mimetype,
      },
    });
  }
);

module.exports = router;
