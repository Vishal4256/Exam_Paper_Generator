import nodemailer from 'nodemailer';

// Validate email configuration
const validateEmailConfig = () => {
    if (!process.env.SMTP_USER) {
        throw new Error('SMTP_USER environment variable is not set. Please configure your email in .env file.');
    }
    if (!process.env.SMTP_PASS) {
        throw new Error('SMTP_PASS environment variable is not set. Please configure your email password/app password in .env file.');
    }
};

// Create reusable transporter object using SMTP transport
export const createTransporter = () => {
    validateEmailConfig();
    
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: process.env.SMTP_PORT || 465,
        secure: Number(process.env.SMTP_PORT) === 465,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false // For development, set to true in production
        }
    });
};

// Send OTP email for email verification
export const sendVerificationOTP = async (email, otp) => {
    try {
        const transporter = createTransporter();
        
        try {
            await transporter.verify();
            console.log("SMTP connection verified successfully for OTP");
        } catch (verifyError) {
            console.error("SMTP Verification Error in OTP:", verifyError);
            throw verifyError;
        }

        const mailOptions = {
            from: `"${process.env.APP_NAME || 'Exam Paper Generator'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Email Verification OTP',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Email Verification</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Thank you for registering! Please use the following OTP to verify your email address:
                        </p>
                        <div style="background-color: #f0f0f0; padding: 20px; border-radius: 8px; text-align: center; margin: 30px 0;">
                            <h1 style="color: #4F46E5; font-size: 36px; letter-spacing: 8px; margin: 0; font-weight: bold;">${otp}</h1>
                        </div>
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            This OTP will expire in 10 minutes. If you didn't request this verification, please ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                            This is an automated message, please do not reply.
                        </p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Verification OTP email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending verification OTP email:', error);
        
        // Provide more detailed error messages
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your SMTP_USER and SMTP_PASS in .env file.');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            throw new Error('Could not connect to email server. Please check your SMTP_HOST and SMTP_PORT settings.');
        } else if (error.message.includes('SMTP_USER') || error.message.includes('SMTP_PASS')) {
            throw error; // Re-throw validation errors as-is
        } else {
            throw new Error(`Failed to send verification email: ${error.message || error.toString()}`);
        }
    }
};

// Send Password Reset Link email
export const sendPasswordResetLink = async (email, name, resetLink) => {
    try {
        const transporter = createTransporter();
        
        try {
            await transporter.verify();
            console.log("SMTP connection verified successfully for Password Reset");
        } catch (verifyError) {
            console.error("SMTP Verification Error in Password Reset:", verifyError);
            throw verifyError;
        }

        const mailOptions = {
            from: `"${process.env.APP_NAME || 'Exam Paper Generator'}" <${process.env.SMTP_USER}>`,
            to: email,
            subject: 'Reset Your ExamFlow Password',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
                    <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                        <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Hello ${name},
                        </p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            We received a request to reset your password.
                        </p>
                        <p style="color: #666; font-size: 16px; line-height: 1.6;">
                            Click below to reset:
                        </p>
                        <div style="margin: 30px 0;">
                            <a href="${resetLink}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Reset Password</a>
                        </div>
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            Or copy and paste this link into your browser: <br/>
                            <a href="${resetLink}" style="color: #4F46E5; word-break: break-all;">${resetLink}</a>
                        </p>
                        <p style="color: #666; font-size: 14px; line-height: 1.6; margin-top: 20px;">
                            This link expires in 1 hour.
                        </p>
                        <p style="color: #666; font-size: 14px; line-height: 1.6;">
                            If you didn't request this, ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
                        <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                            This is an automated message, please do not reply.
                        </p>
                    </div>
                </div>
            `,
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Password reset link email sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending password reset link email:', error);
        
        // Provide more detailed error messages
        if (error.code === 'EAUTH') {
            throw new Error('Email authentication failed. Please check your SMTP_USER and SMTP_PASS in .env file.');
        } else if (error.code === 'ECONNECTION' || error.code === 'ETIMEDOUT') {
            throw new Error('Could not connect to email server. Please check your SMTP_HOST and SMTP_PORT settings.');
        } else if (error.message.includes('SMTP_USER') || error.message.includes('SMTP_PASS')) {
            throw error; // Re-throw validation errors as-is
        } else {
            throw new Error(`Failed to send password reset email: ${error.message || error.toString()}`);
        }
    }
};

// Generate a 6-digit OTP
export const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

