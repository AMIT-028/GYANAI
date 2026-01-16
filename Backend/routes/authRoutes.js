const express = require("express");
const { register, login } = require("../controllers/authcontroller");
const protect = require("../middlewares/authMiddleware");
const authorize = require("../middlewares/roleMiddleware");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

// protected test route
router.get("/me", protect, (req, res) => {
  res.json(req.user);
});

// admin-only route
router.get("/admin", protect, authorize("admin"), (req, res) => {
  res.json({ message: "Welcome Admin" });
});

module.exports = router;
