import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

async function testMail() {
    console.log("Testing email with:", process.env.SMTP_USER);
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: 465, // Force 465
        secure: true, // true for 465
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
        tls: {
            rejectUnauthorized: false
        }
    });

    try {
        await transporter.verify();
        console.log("Transporter verification successful!");
    } catch (err) {
        console.error("Transporter verification failed:", err);
    }
}

testMail();
