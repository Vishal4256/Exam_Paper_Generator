import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || "re_dummy");

export const sendVerificationEmail = async (email, otp) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is missing");
        }

        const subject = 'Verify Your Email - ExamFlow';
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                    <h2 style="color: #333; margin-bottom: 20px;">Verification Code</h2>
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">Hello,</p>
                    <p style="color: #666; font-size: 16px; line-height: 1.6;">Your OTP for ExamFlow email verification is:</p>
                    <div style="margin: 30px 0; text-align: center;">
                        <span style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #4F46E5;">${otp}</span>
                    </div>
                    <p style="color: #666; font-size: 14px; line-height: 1.6;">This OTP will expire in 10 minutes.</p>
                    <p style="color: #666; font-size: 14px; line-height: 1.6;">If you did not request this, please ignore this email.</p>
                    <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">Regards,<br>ExamFlow Team</p>
                </div>
            </div>
        `;

        const response = await resend.emails.send({
            from: `${process.env.APP_NAME || 'ExamFlow'} <noreply@resend.dev>`,
            to: email,
            subject: subject,
            html: html
        });

        if (response.error) {
            throw new Error(response.error.message);
        }

        console.log("Email sent successfully via Resend:", response.data?.id);
        return { success: true, messageId: response.data?.id };
    } catch (error) {
        console.error("Email sending failed:", error);
        return { success: false, error: error.message };
    }
};

export const sendPasswordResetLink = async (email, name, resetLink) => {
    try {
        if (!process.env.RESEND_API_KEY) {
            throw new Error("RESEND_API_KEY is missing");
        }

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
        
        const response = await resend.emails.send({
            from: `${process.env.APP_NAME || 'ExamFlow'} <noreply@resend.dev>`,
            to: email,
            subject: subject,
            html: html
        });

        if (response.error) {
            throw new Error(response.error.message);
        }

        console.log("Password reset email sent successfully via Resend:", response.data?.id);
        return { success: true, messageId: response.data?.id };
    } catch (error) {
        console.error("Email sending failed:", error);
        return { success: false, error: error.message };
    }
};
