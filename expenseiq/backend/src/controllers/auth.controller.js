const jwt  = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const User = require("../models/user.model");

// ── Helpers ───────────────────────────────────────────────────────────────────
const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const sendOTPToPhone = async (phone, otp) => {
  // TODO: Integrate Twilio / MSG91 / Fast2SMS here
  console.log(`📱 OTP for ${phone}: ${otp}`);
};

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, username, password, phone } = req.body;
    if (!name || !username || !password) {
      return res.status(400).json({ success: false, message: "name, username and password are required" });
    }

    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ success: false, message: "Username already taken" });

    const hashed = await bcrypt.hash(password, 10);
    const user   = await User.create({ name, username, password: hashed, phone });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password are required" });
    }

    const user = await User.findOne({ username }).select("+password");
    if (!user) return res.status(401).json({ success: false, message: "Invalid username or password" });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ success: false, message: "Invalid username or password" });

    const token = signToken(user._id);
    const { password: _pw, ...safeUser } = user.toObject();
    res.json({ success: true, token, user: safeUser });
  } catch (err) { next(err); }
};

// ── POST /api/auth/send-otp ───────────────────────────────────────────────────
exports.sendOTP = async (req, res, next) => {
  try {
    const { phone, name } = req.body;
    if (!phone) return res.status(400).json({ success: false, message: "Phone number is required" });

    const otp       = generateOTP();
    const expiresAt = new Date(Date.now() + (parseInt(process.env.OTP_EXPIRY_MINUTES) || 10) * 60 * 1000);

    let user = await User.findOne({ phone });
    if (!user) {
      if (!name) return res.status(400).json({ success: false, message: "Name is required for new users" });
      user = new User({ name, phone });
    }
    user.otp = { code: otp, expiresAt };
    await user.save();
    await sendOTPToPhone(phone, otp);

    res.json({ success: true, message: "OTP sent successfully", phone });
  } catch (err) { next(err); }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;
    if (!phone || !otp) return res.status(400).json({ success: false, message: "Phone and OTP are required" });

    const user = await User.findOne({ phone });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    if (!user.otp?.code || user.otp.code !== otp)
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    if (new Date() > user.otp.expiresAt)
      return res.status(400).json({ success: false, message: "OTP has expired" });

    user.otp = undefined;
    await user.save();

    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
exports.googleLogin = async (req, res, next) => {
  try {
    const { googleId, name, email, avatar } = req.body;
    if (!googleId || !name || !email) {
      return res.status(400).json({ success: false, message: "googleId, name and email are required" });
    }

    let user = await User.findOne({ $or: [{ googleId }, { email }] });
    if (user) {
      user.googleId = googleId;
      user.name     = name;
      user.avatar   = avatar || user.avatar;
      await user.save();
    } else {
      user = await User.create({ googleId, name, email, avatar });
    }

    const token = signToken(user._id);
    res.json({ success: true, token, user });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
