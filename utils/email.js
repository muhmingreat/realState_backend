const nodemailer = require("nodemailer");
require("dotenv").config();

// ✅ Setup transporter once
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ✅ Send email helper
async function sendEmail(to, subject, text) {
  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to,
      subject,
      text,
    });
    console.log(`📧 Email sent to ${to}: ${subject}`);
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
  }
}

module.exports = { sendEmail };
