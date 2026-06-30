import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
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
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'ExamFlow'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Verify Your Email - ExamFlow",
      html: html,
    });
    return { success: true };
  } catch (error) {
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
    await transporter.sendMail({
      from: `"${process.env.APP_NAME || 'ExamFlow'}" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Reset Your Password - ExamFlow",
      html: html,
    });
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};
