const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000, // 10 seconds
  greetingTimeout: 10000,
  socketTimeout: 10000
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP connection failed:", error.message);
  } else {
    console.log("✅ SMTP server is ready");
  }
});

const sendEmail = async ({ to, subject, html }) => {
  return await transporter.sendMail({
    from: `"ExpenseIQ" <${process.env.SMTP_USER}>`,
    to,
    subject,
    html,
  });
};

module.exports = { sendEmail, transporter };
