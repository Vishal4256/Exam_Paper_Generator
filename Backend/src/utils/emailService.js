import nodemailer from 'nodemailer';
import { Resend } from 'resend';

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);

// Validate and clean environment variables
const validateEmailConfig = () => {
    if (!process.env.SMTP_USER) {
        throw new Error('SMTP_USER environment variable is not set. Please configure your email in .env file.');
    }
    if (!process.env.SMTP_PASS) {
        throw new Error('SMTP_PASS environment variable is not set. Please configure your email password/app password in .env file.');
    }
    
    // Ensure SMTP_PASS has no spaces
    process.env.SMTP_PASS = process.env.SMTP_PASS.replace(/\s/g, '');
};

// Startup Logging
console.log("SMTP CONFIG");
console.log({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: process.env.SMTP_PORT == "465",
  userExists: !!process.env.SMTP_USER,
  passExists: !!process.env.SMTP_PASS,
});

// Create reusable transporter object using SMTP transport
export const createTransporter = () => {
    validateEmailConfig();
    
    const port = Number(process.env.SMTP_PORT) || 465;
    
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: port,
        secure: port === 465, // MUST be true for port 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        connectionTimeout: 30000,
        greetingTimeout: 30000,
        socketTimeout: 30000,
        tls: {
            rejectUnauthorized: false
        }
    });
};

// Internal function to send via Resend fallback
const sendViaResend = async (email, subject, html) => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured for fallback.');
    }
    console.log(`Falling back to Resend to send email to ${email}`);
    
    const response = await resend.emails.send({
        from: `${process.env.APP_NAME || 'ExamFlow'} <noreply@resend.dev>`, 
        to: email,
        subject: subject,
        html: html
    });

    if (response.error) {
        throw new Error(`Resend Error: ${response.error.message}`);
    }

    console.log('Email sent successfully via Resend:', response.data.id);
    return { success: true, messageId: response.data.id, provider: 'resend' };
};

// Send Password Reset Link email
export const sendPasswordResetLink = async (email, name, resetLink) => {
    const subject = 'Reset Your ExamFlow Password';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello ${name},</p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">We received a request to reset your password.</p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Click below to reset:</p>
                <div style="margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">
                    Or copy and paste this link into your browser: <br/>
                    <a href="${resetLink}" style="color: #4F46E5; word-break: break-all;">${resetLink}</a>
                </p>
                <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">This link expires in 1 hour.</p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">If you didn't request this, ignore this email.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">This is an automated message, please do not reply.</p>
            </div>
        </div>
    `;

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"${process.env.APP_NAME || 'ExamFlow'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset link email sent via SMTP: %s', info.messageId);
        return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (error) {
        console.error('SMTP Delivery failed:', error.message || error);
        
        try {
            return await sendViaResend(email, subject, html);
        } catch (resendError) {
            console.error('Resend fallback also failed:', resendError);
            throw new Error(`Email delivery failed (SMTP Error: ${error.message || 'Unknown'}). Fallback also failed: ${resendError.message}`);
        }
    }
};

// Send OTP Email
export const sendOTPEmail = async (email, otp) => {
    const subject = 'Your Verification Code';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px;">Verification Code</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Please use the following code to verify your action:</p>
                <div style="margin: 30px 0; text-align: center;">
                    <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">${otp}</span>
                </div>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">This code expires in 10 minutes.</p>
                <p style="color: #666; font-size: 14px; line-height: 1.6;">If you didn't request this, ignore this email.</p>
            </div>
        </div>
    `;

    try {
        const transporter = createTransporter();
        const mailOptions = {
            from: `"${process.env.APP_NAME || 'ExamFlow'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: subject,
            html: html,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('OTP email sent via SMTP: %s', info.messageId);
        return { success: true, messageId: info.messageId, provider: 'smtp' };
    } catch (error) {
        console.error('SMTP Delivery failed for OTP:', error.message || error);
        
        try {
            return await sendViaResend(email, subject, html);
        } catch (resendError) {
            console.error('Resend fallback also failed for OTP:', resendError);
            throw new Error(`Email delivery failed (SMTP Error: ${error.message || 'Unknown'}). Fallback also failed: ${resendError.message}`);
        }
    }
};


