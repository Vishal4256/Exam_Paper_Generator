import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 10000,
  socketTimeout: 10000,
});

export const sendVerificationEmail = async (email, otp) => {
  try {
    const html = `
<div style="font-family: Arial, sans-serif;">
  <h2>Email Verification - ExamFlow</h2>
  <p>Your OTP is:</p>
  <h1 style="color:#4f46e5;">${otp}</h1>
  <p>This OTP expires in 10 minutes.</p>
</div>
`;
    const sendMailPromise = transporter.sendMail({
      from: `"ExamFlow" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Verify Your Email - ExamFlow",
      html: html,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email timeout")), 10000)
    );

    await Promise.race([sendMailPromise, timeoutPromise]);
    
    console.log(`✓ Email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`✗ Email sending failed:\n${error.message}`);
    return { success: false, error: error.message };
  }
};

export const sendPasswordResetLink = async (email, resetLink) => {
  try {
    const html = `
<div style="font-family: Arial, sans-serif;">
  <h2>Reset Your Password</h2>
  <p>Click the button below to reset your password:</p>

  <a
    href="${resetLink}"
    style="
      background:#4f46e5;
      color:white;
      padding:12px 24px;
      border-radius:6px;
      text-decoration:none;
      display:inline-block;
    "
  >
    Reset Password
  </a>

  <p>If you did not request this, ignore this email.</p>
</div>
`;
    const sendMailPromise = transporter.sendMail({
      from: `"ExamFlow" <${process.env.EMAIL_FROM}>`,
      to: email,
      subject: "Reset Your Password - ExamFlow",
      html: html,
    });

    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Email timeout")), 10000)
    );

    await Promise.race([sendMailPromise, timeoutPromise]);

    console.log(`✓ Email sent successfully to ${email}`);
    return { success: true };
  } catch (error) {
    console.error(`✗ Email sending failed:\n${error.message}`);
    return { success: false, error: error.message };
  }
};
