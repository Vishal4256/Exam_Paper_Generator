import nodemailer from 'nodemailer';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

const validateEmailConfig = () => {
    if (process.env.SMTP_PASS) {
        process.env.SMTP_PASS = process.env.SMTP_PASS.replace(/\s/g, '');
    }
};

export const createTransporter = () => {
    validateEmailConfig();
    
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.gmail.com",
        port: Number(process.env.SMTP_PORT) || 465,
        secure: Number(process.env.SMTP_PORT) === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        connectionTimeout: 60000,
        greetingTimeout: 60000,
        socketTimeout: 60000,
        tls: {
            rejectUnauthorized: false,
            ciphers: "SSLv3"
        }
    });
};

const sendViaSMTP = async (email, subject, html) => {
    const transporter = createTransporter();
    await transporter.verify();
    const mailOptions = {
        from: `"${process.env.APP_NAME || 'ExamFlow'}" <${process.env.SMTP_USER}>`,
        to: email,
        subject: subject,
        html: html,
    };
    const info = await transporter.sendMail(mailOptions);
    console.log({
        provider: 'gmail',
        accepted: info.accepted,
        rejected: info.rejected,
        messageId: info.messageId,
        response: info.response
    });
    return { success: true, messageId: info.messageId, provider: 'gmail' };
};

const sendEmail = async (email, subject, html) => {
    try {
        if (!process.env.RESEND_API_KEY) throw new Error("RESEND_API_KEY missing");
        const response = await resend.emails.send({
            from: `${process.env.APP_NAME || 'ExamFlow'} <noreply@resend.dev>`,
            to: email,
            subject: subject,
            html: html
        });
        if (response.error) throw new Error(response.error.message);
        
        console.log({
            provider: 'resend',
            accepted: [email],
            rejected: [],
            messageId: response.data?.id,
            response: 'OK'
        });
        return { success: true, messageId: response.data?.id, provider: 'resend' };
    } catch (resendError) {
        console.warn("Resend failed, falling back to Gmail SMTP:", resendError.message);
        try {
            return await sendViaSMTP(email, subject, html);
        } catch (smtpError) {
            console.error("Gmail SMTP also failed:", smtpError.message);
            throw smtpError;
        }
    }
};

export const sendPasswordResetLink = async (email, name, resetLink) => {
    const subject = 'Reset Your ExamFlow Password';
    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello ${name},</p>
                <p style="color: #666; font-size: 16px; line-height: 1.6;">We received a request to reset your password.</p>
                <div style="margin: 30px 0;">
                    <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                </div>
                <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">This is an automated message, please do not reply.</p>
            </div>
        </div>
    `;
    return await sendEmail(email, subject, html);
};

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
            </div>
        </div>
    `;
    return await sendEmail(email, subject, html);
};


