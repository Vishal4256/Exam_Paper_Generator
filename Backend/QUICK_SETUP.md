# Quick Email Setup Guide

## The Error You're Seeing

If you see: `"Failed to send verification email"` or `"SMTP_USER environment variable is not set"`, you need to configure your email settings.

## Step 1: Create .env File

Create a file named `.env` in the `Backend` folder (same level as `package.json`).

## Step 2: Add Email Configuration

Add these lines to your `.env` file:

```env
# Email Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
APP_NAME=Exam Paper Generator
```

## Step 3: Get Gmail App Password

1. Go to your Google Account: https://myaccount.google.com/
2. Click **Security** on the left
3. Enable **2-Step Verification** if not already enabled
4. Go to: https://myaccount.google.com/apppasswords
5. Select **Mail** and **Other (Custom name)**
6. Enter "Exam Paper Generator" as the name
7. Click **Generate**
8. Copy the 16-character password (no spaces)
9. Paste it as `SMTP_PASS` in your `.env` file

## Step 4: Restart Server

After adding the `.env` file, restart your backend server:

```bash
# Stop the server (Ctrl+C) and restart
npm run dev
```

## Testing

Try registering a new user. You should now receive an OTP email!

## Common Issues

- **"SMTP_USER not set"**: Make sure `.env` file exists in `Backend` folder
- **"Email authentication failed"**: Check that your App Password is correct (16 characters, no spaces)
- **"Could not connect"**: Check your internet connection and SMTP settings

## Example .env File

```env
PORT=3000
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=myemail@gmail.com
SMTP_PASS=abcd efgh ijkl mnop
APP_NAME=Exam Paper Generator
```

**Note**: Remove spaces from the App Password when pasting it!

