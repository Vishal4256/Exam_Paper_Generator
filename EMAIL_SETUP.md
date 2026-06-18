# Email Authentication Setup Guide

This document explains how to configure nodemailer for OTP-based email verification and password reset functionality.

## Features Implemented

1. **Email Verification During Registration**
   - Users receive an OTP via email after registration
   - Email must be verified before login
   - OTP expires in 10 minutes
   - Resend OTP functionality available

2. **Forgot Password with OTP**
   - Users can request password reset via email
   - OTP is sent to registered email
   - OTP verification required before password reset
   - OTP expires in 10 minutes

## Environment Variables Required

Add these to your `Backend/.env` file:

```env
# Email Configuration (for Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password_here
APP_NAME=Exam Paper Generator
```

## Gmail Setup Instructions

1. **Enable 2-Step Verification**
   - Go to your Google Account settings
   - Navigate to Security → 2-Step Verification
   - Enable it if not already enabled

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Enter "Exam Paper Generator" as the name
   - Copy the generated 16-character password
   - Use this password as `SMTP_PASS` in your `.env` file

3. **Alternative Email Providers**
   - For Outlook/Hotmail: Use `smtp-mail.outlook.com` with port `587`
   - For Yahoo: Use `smtp.mail.yahoo.com` with port `587`
   - For custom SMTP: Update `SMTP_HOST` and `SMTP_PORT` accordingly

## API Endpoints

### Registration Flow
- `POST /api/auth/register` - Register user and send OTP
- `POST /api/auth/verify-email-otp` - Verify email with OTP
- `POST /api/auth/resend-verification-otp` - Resend verification OTP

### Password Reset Flow
- `POST /api/auth/forgot-password` - Request password reset OTP
- `POST /api/auth/verify-password-reset-otp` - Verify password reset OTP
- `POST /api/auth/reset-password` - Reset password with verified OTP

### Login
- `POST /api/auth/login` - Login (requires verified email)

## Frontend Routes

- `/register` - Registration with OTP verification
- `/forgot-password` - Password reset with OTP
- `/login` - Login page (with link to forgot password)

## User Flow

### Registration
1. User fills registration form (name, email, password)
2. OTP is sent to email
3. User enters OTP to verify email
4. User can now login

### Password Reset
1. User enters email on forgot password page
2. OTP is sent to email
3. User enters OTP to verify
4. User sets new password
5. User can login with new password

## Testing

1. Make sure your `.env` file has correct email credentials
2. Start the backend server: `cd Backend && npm run dev`
3. Start the frontend: `cd Frontend && npm run dev`
4. Test registration flow
5. Check email inbox for OTP
6. Test password reset flow

## Troubleshooting

- **Email not sending**: Check SMTP credentials and ensure App Password is correct
- **OTP expired**: Request a new OTP (expires in 10 minutes)
- **Invalid OTP**: Ensure you're entering the correct 6-digit code
- **Email already verified**: User can proceed to login

## Security Notes

- OTPs expire after 10 minutes
- OTPs are single-use (cleared after successful verification)
- Email verification is required before login
- Passwords are hashed using bcrypt
