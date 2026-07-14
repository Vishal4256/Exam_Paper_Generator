import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

console.log("Loading Gmail SMTP configuration...");
console.log("SMTP_HOST:", process.env.SMTP_HOST);
console.log("SMTP_PORT:", process.env.SMTP_PORT);
console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
console.log("EMAIL_PASS exists:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT),
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

try {
    console.time("SMTP Verify");
    await transporter.verify();
    console.timeEnd("SMTP Verify");
    console.log("✅ Gmail SMTP Connected Successfully");
} catch (error) {
    console.error("❌ Gmail SMTP Verification Failed during startup:");
    console.error(error);
}

const APP_NAME = process.env.APP_NAME || "ExamFlow";

export const sendVerificationEmail = async (email, otp) => {
  try {
    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #4f46e5; margin: 0;">${APP_NAME}</h1>
  </div>
  <h2 style="color: #1f2937;">Verify Your Email</h2>
  <p style="color: #4b5563; line-height: 1.6;">Your OTP for email verification is:</p>
  <div style="text-align: center; margin: 32px 0;">
    <h1 style="color: #4f46e5; font-size: 48px; letter-spacing: 8px; margin: 0; background-color: #f3f4f6; padding: 16px; border-radius: 8px; display: inline-block;">${otp}</h1>
  </div>
  <p style="color: #ef4444; font-weight: bold; text-align: center;">This OTP expires in 10 minutes.</p>
  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you did not request this, please ignore this email.</p>
</div>
`;

    const mailOptions = {
      from: `"${APP_NAME}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `Verify Your Email - ${APP_NAME}`,
      html: htmlContent
    };

    console.time("Send Mail");
    const info = await transporter.sendMail(mailOptions);
    console.timeEnd("Send Mail");

    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);

    return { success: true };
  } catch (error) {
    console.error("========== SMTP ERROR ==========");
    console.error(error);
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error("Message:", error.message);
    console.error(error.stack);
    console.error("================================");

    return {
        success: false,
        error: error.message,
        fullError: error
    };
  }
};

export const sendPasswordResetLink = async (email, resetLink) => {
  try {
    const htmlContent = `
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px;">
  <div style="text-align: center; margin-bottom: 24px;">
    <h1 style="color: #4f46e5; margin: 0;">${APP_NAME}</h1>
  </div>
  <h2 style="color: #1f2937;">Reset Your Password</h2>
  <p style="color: #4b5563; line-height: 1.6;">Click the button below to reset your password:</p>
  <div style="text-align: center; margin: 32px 0;">
    <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 14px 28px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">Reset Password</a>
  </div>
  <p style="color: #4b5563; line-height: 1.6; text-align: center;">Alternatively, copy and paste this link into your browser:</p>
  <p style="color: #6b7280; font-size: 14px; text-align: center; word-break: break-all;">${resetLink}</p>
  <p style="color: #ef4444; font-weight: bold; text-align: center; margin-top: 24px;">This link expires in 1 hour.</p>
  <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 32px 0;" />
  <p style="color: #9ca3af; font-size: 12px; text-align: center;">If you did not request a password reset, please ignore this email.</p>
</div>
`;

    const mailOptions = {
      from: `"${APP_NAME}" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to: email,
      subject: `Reset Your Password - ${APP_NAME}`,
      html: htmlContent
    };

    console.time("Send Mail");
    const info = await transporter.sendMail(mailOptions);
    console.timeEnd("Send Mail");

    console.log("Message ID:", info.messageId);
    console.log("Accepted:", info.accepted);
    console.log("Rejected:", info.rejected);
    console.log("Response:", info.response);

    return { success: true };
  } catch (error) {
    console.error("========== SMTP ERROR ==========");
    console.error(error);
    console.error("Code:", error.code);
    console.error("Command:", error.command);
    console.error("Response:", error.response);
    console.error("Message:", error.message);
    console.error(error.stack);
    console.error("================================");

    return {
        success: false,
        error: error.message,
        fullError: error
    };
  }
};
