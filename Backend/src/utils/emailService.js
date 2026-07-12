import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const BREVO_API_URL = "https://api.brevo.com/v3/smtp/email";

export const sendVerificationEmail = async (email, otp) => {
  try {
    console.log(`Email request started for verification: ${email}`);

    const htmlContent = `
<div style="font-family: Arial, sans-serif;">
  <p>Your OTP is:</p>
  <br>
  <h1 style="color:#4f46e5;">${otp}</h1>
  <br>
  <p>This OTP expires in 10 minutes.</p>
</div>
`;

    const payload = {
      sender: {
        name: "ExamFlow",
        email: process.env.EMAIL_FROM || "vishal42564256@gmail.com"
      },
      to: [{ email: email }],
      subject: "Verify Your Email - ExamFlow",
      htmlContent: htmlContent
    };

    console.log("========== BREVO REQUEST ==========");
    console.log("BREVO_API_KEY exists:", !!process.env.BREVO_API_KEY);
    console.log("BREVO_API_KEY Prefix:", process.env.BREVO_API_KEY?.substring(0, 10));
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log("Recipient:", email);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("===================================");

    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log(`Brevo API response: HTTP ${response.status}`);
    console.log(`✓ Email sent successfully to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.log("========== BREVO ERROR ==========");
    console.log("Status:", error.response?.status);
    console.log(
        "Response Data:",
        JSON.stringify(error.response?.data, null, 2)
    );
    console.log(
        "Headers:",
        JSON.stringify(error.response?.headers, null, 2)
    );
    console.log("Message:", error.message);
    console.log("Stack:", error.stack);
    console.log("================================");

    return {
        success: false,
        error: error.response?.data || error.message
    };
  }
};

export const sendPasswordResetLink = async (email, resetLink) => {
  try {
    console.log(`Email request started for password reset: ${email}`);

    const htmlContent = `
<div style="font-family: Arial, sans-serif;">
  <h2>Reset Your Password</h2>
  <p>Click the button below to reset your password:</p>
  <br>
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
  <br>
  <p>If you did not request this, ignore this email.</p>
</div>
`;

    const payload = {
      sender: {
        name: "ExamFlow",
        email: process.env.EMAIL_FROM || "vishal42564256@gmail.com"
      },
      to: [{ email: email }],
      subject: "Reset Your Password - ExamFlow",
      htmlContent: htmlContent
    };

    console.log("========== BREVO REQUEST ==========");
    console.log("BREVO_API_KEY exists:", !!process.env.BREVO_API_KEY);
    console.log("BREVO_API_KEY Prefix:", process.env.BREVO_API_KEY?.substring(0, 10));
    console.log("EMAIL_FROM:", process.env.EMAIL_FROM);
    console.log("Recipient:", email);
    console.log("Payload:", JSON.stringify(payload, null, 2));
    console.log("===================================");

    const response = await axios.post(BREVO_API_URL, payload, {
      headers: {
        "api-key": process.env.BREVO_API_KEY,
        "Content-Type": "application/json"
      }
    });

    console.log(`Brevo API response: HTTP ${response.status}`);
    console.log(`✓ Email sent successfully to ${email}`);
    
    return { success: true };
  } catch (error) {
    console.log("========== BREVO ERROR ==========");
    console.log("Status:", error.response?.status);
    console.log(
        "Response Data:",
        JSON.stringify(error.response?.data, null, 2)
    );
    console.log(
        "Headers:",
        JSON.stringify(error.response?.headers, null, 2)
    );
    console.log("Message:", error.message);
    console.log("Stack:", error.stack);
    console.log("================================");

    return {
        success: false,
        error: error.response?.data || error.message
    };
  }
};
