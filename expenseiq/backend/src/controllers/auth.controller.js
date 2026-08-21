const jwt  = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/user.model");
const EmailVerification = require("../models/emailVerification.model");
const { sendEmail } = require("../utils/sendEmail");

// ── Helpers ───────────────────────────────────────────────────────────────────
const signToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ── POST /api/auth/register ───────────────────────────────────────────────────
exports.register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    if (!name || !email || !password || !phone) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    console.log(`[register] Registration request received for: ${normalizedEmail}`);

    // Confirm email OTP verification
    const verificationRecord = await EmailVerification.findOne({ email: normalizedEmail, isVerified: true });
    if (!verificationRecord) {
      return res.status(400).json({ success: false, message: "Email not verified. Please verify your OTP first." });
    }

    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    // Double check phone unique constraint
    const phoneExists = await User.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({ success: false, message: "Phone number is already registered" });
    }

    console.log(`[register] Creating user...`);
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email: normalizedEmail,
      username: normalizedEmail,
      password: hashedPassword,
      phone,
      emailVerified: true
    });

    console.log(`[register] User created successfully: ${user._id}`);
    
    // Clean up the verification record
    await EmailVerification.deleteOne({ email: normalizedEmail });

    const token = signToken(user._id);
    res.status(201).json({ success: true, token, user });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/login ──────────────────────────────────────────────────────
exports.login = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ success: false, message: "username and password are required" });
    }

    const user = await User.findOne({
      $or: [
        { username: username.trim().toLowerCase() },
        { email: username.trim().toLowerCase() }
      ]
    }).select("+password");

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
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email address is required" });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: "Please enter a valid email address" });
    }

    console.log(`[sendOTP] Request received`);
    const exists = await User.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: "Email is already registered" });
    }

    console.log(`[sendOTP] Generating OTP...`);
    const otp = crypto.randomInt(100000, 1000000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await EmailVerification.findOneAndUpdate(
      { email: normalizedEmail },
      { otpHash, expiresAt, attempts: 0, isVerified: false },
      { upsert: true, new: true }
    );

    const maskedEmail = normalizedEmail.replace(/^(.)(.*)(@.*)$/, (_, first, middle, domain) => {
      return first + "*".repeat(middle.length) + domain;
    });
    console.log(`[sendOTP] Sending email through Resend`);

    try {
      await sendEmail({
        to: normalizedEmail,
        subject: "ExpenseIQ Email Verification OTP",
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #ffffff;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="color: #6366f1; margin: 0; font-size: 24px;">ExpenseIQ</h2>
              <p style="color: #64748b; font-size: 14px; margin: 5px 0 0 0;">Email Verification Required</p>
            </div>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Hello,</p>
            <p style="color: #334155; font-size: 16px; line-height: 1.5;">Thank you for registering with ExpenseIQ. Please use the following 6-digit verification code to complete your registration:</p>
            <div style="text-align: center; margin: 30px 0;">
              <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4f46e5; background-color: #f5f3ff; padding: 12px 24px; border-radius: 10px; border: 1px dashed #c7d2fe; display: inline-block;">${otp}</span>
            </div>
            <p style="color: #ef4444; font-size: 14px; font-weight: 500;">This OTP will expire in 5 minutes.</p>
            <p style="color: #64748b; font-size: 14px; line-height: 1.5; margin-top: 20px;">If you did not initiate this request, you can safely ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #f1f5f9; margin: 25px 0;" />
            <p style="font-size: 12px; color: #94a3b8; text-align: center; margin: 0;">Smart Personal Finance & Investment Management</p>
          </div>
        `,
      });
      console.log(`[sendOTP] Email accepted by Resend`);
      return res.json({ success: true, message: "OTP sent successfully" });
    } catch (mailErr) {
      console.error("[sendOTP] Failed to send email:", mailErr.message);
      return res.status(500).json({ success: false, message: "Unable to send OTP. Please try again." });
    }
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/verify-otp ─────────────────────────────────────────────────
exports.verifyOTP = async (req, res, next) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp) {
      return res.status(400).json({ success: false, message: "Email and OTP are required" });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const verificationRecord = await EmailVerification.findOne({ email: normalizedEmail });

    if (!verificationRecord) {
      return res.status(400).json({ success: false, message: "OTP expired or not found. Please request a new OTP." });
    }

    if (new Date() > verificationRecord.expiresAt) {
      return res.status(400).json({ success: false, message: "OTP expired. Please request a new OTP." });
    }

    if (verificationRecord.attempts >= 5) {
      return res.status(400).json({ success: false, message: "Too many failed attempts. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(otp, verificationRecord.otpHash);
    if (!isMatch) {
      verificationRecord.attempts += 1;
      await verificationRecord.save();
      return res.status(400).json({ success: false, message: "Invalid OTP" });
    }

    console.log(`[verifyOTP] OTP verification successful for: ${normalizedEmail}`);
    verificationRecord.isVerified = true;
    verificationRecord.expiresAt = new Date(Date.now() + 15 * 60 * 1000);
    await verificationRecord.save();

    res.json({ success: true, message: "Email verified successfully" });
  } catch (err) {
    next(err);
  }
};

// ── POST /api/auth/google ─────────────────────────────────────────────────────
// Verifies Google ID token server-side, then checks if user exists in MongoDB.
// If exists → login. If not → return exists:false so frontend redirects to signup.
exports.googleLogin = async (req, res, next) => {
  try {
    const { credential } = req.body;
    if (!credential) {
      return res.status(400).json({ success: false, message: "Google credential is required" });
    }

    // Verify the Google ID token
    let ticket;
    try {
      ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
      });
    } catch (verifyErr) {
      console.error("[googleLogin] Google token verification failed:", verifyErr.message);
      return res.status(401).json({ success: false, message: "Google authentication failed. Please try again." });
    }

    const payload = ticket.getPayload();
    const googleId = payload.sub;
    const email = payload.email.toLowerCase().trim();
    const name = payload.name || "";
    const avatar = payload.picture || null;

    console.log(`[googleLogin] Google identity verified for: ${email}`);

    // Check if user exists in MongoDB
    const user = await User.findOne({ email });

    if (user) {
      // ── Existing user → Login ───────────────────────────────────────────
      console.log(`[googleLogin] User found in MongoDB. Logging in.`);
      if (!user.googleId) {
        user.googleId = googleId;
        await user.save();
      }
      const token = signToken(user._id);
      return res.json({ success: true, exists: true, token, user });
    } else {
      // ── New user → Redirect to signup ───────────────────────────────────
      console.log(`[googleLogin] User NOT found in MongoDB. Redirecting to signup.`);
      return res.json({
        success: true,
        exists: false,
        message: "Account not found. Please create an account.",
        redirect: "/signup",
        email,
        name,
        avatar,
      });
    }
  } catch (err) {
    console.error("[googleLogin] Server error:", err.message);
    if (err.name === "MongoServerError" || err.name === "MongooseError" || err.name === "MongoError") {
      return res.status(500).json({ success: false, message: "Unable to check your account right now. Please try again later." });
    }
    next(err);
  }
};

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
exports.getMe = async (req, res) => {
  res.json({ success: true, user: req.user });
};
