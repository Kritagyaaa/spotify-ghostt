const nodemailer = require('nodemailer');

// Create transporter from environment variables
function getTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  // If credentials are not set or contain placeholders, return null (triggers Mock Mode)
  if (!user || !pass || user.includes('your-gmail') || pass.includes('your-gmail')) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port: parseInt(port, 10),
    secure: parseInt(port, 10) === 465, // true for 465 (SSL), false for other ports (TLS/STARTTLS)
    auth: {
      user,
      pass,
    },
  });
}

// Custom HTML Template generator
function getEmailHtml(title, greeting, messageBody, codeOrButtonHtml) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${title}</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #121212;
          color: #ffffff;
          margin: 0;
          padding: 40px 20px;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #181818;
          border-radius: 8px;
          padding: 40px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
          border-top: 4px solid #1ED760;
        }
        .logo {
          text-align: center;
          margin-bottom: 30px;
        }
        .logo svg {
          fill: #1ED760;
          width: 50px;
          height: 50px;
        }
        h1 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 20px;
          text-align: center;
          color: #ffffff;
        }
        p {
          font-size: 16px;
          line-height: 1.6;
          color: #b3b3b3;
          margin-bottom: 30px;
        }
        .code-container {
          background-color: #282828;
          border-radius: 6px;
          padding: 20px;
          text-align: center;
          margin: 30px 0;
        }
        .code {
          font-family: 'Courier New', Courier, monospace;
          font-size: 36px;
          font-weight: bold;
          letter-spacing: 6px;
          color: #1ED760;
        }
        .btn-container {
          text-align: center;
          margin: 30px 0;
        }
        .btn {
          background-color: #1ED760;
          color: #000000 !important;
          text-decoration: none;
          font-size: 16px;
          font-weight: 700;
          padding: 14px 32px;
          border-radius: 50px;
          display: inline-block;
          transition: background-color 0.2s;
        }
        .btn:hover {
          background-color: #1fdf64;
        }
        .footer {
          margin-top: 40px;
          border-top: 1px solid #282828;
          padding-top: 20px;
          text-align: center;
          font-size: 12px;
          color: #727272;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="logo">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" style="fill: #1ED760; width: 50px; height: 50px;">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424c-.18.295-.565.387-.86.207-2.377-1.454-5.37-1.783-8.894-.982-.336.076-.67-.135-.746-.472-.076-.336.135-.67.472-.746 3.847-.878 7.14-.505 9.822 1.135.295.18.387.565.207.86zm1.226-2.723c-.227.367-.707.487-1.074.26-2.72-1.672-6.87-2.157-10.076-1.183-.412.125-.845-.107-.97-.52-.125-.413.107-.847.52-.972 3.666-1.112 8.232-.57 11.34 1.342.367.227.487.707.26 1.074zm.106-2.833C14.382 8.87 8.528 8.676 5.136 9.705c-.52.158-1.074-.138-1.232-.658-.158-.52.138-1.074.658-1.232 3.896-1.182 10.372-.958 14.445 1.46.468.278.62.883.342 1.352-.277.47-.883.62-1.35.342z"/>
          </svg>
        </div>
        <h1>${title}</h1>
        <p>Hello ${greeting},</p>
        <p>${messageBody}</p>
        ${codeOrButtonHtml}
        <div class="footer">
          <p>This is an automated message from Spotify Clone. If you did not request this, please ignore this email.</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

async function sendVerificationOtp(email, otp) {
  const subject = 'Verify your Spotify Clone Account';
  const title = 'Verify your Email';
  const greeting = email;
  const messageBody = 'Thank you for signing up for Spotify Clone! Please use the 6-digit verification code below to verify and activate your account. This code is valid for 10 minutes.';
  const codeHtml = `
    <div class="code-container">
      <div class="code">${otp}</div>
    </div>
  `;
  const html = getEmailHtml(title, greeting, messageBody, codeHtml);
  return sendMail(email, subject, html, `Verification OTP: ${otp}`);
}

async function sendResetOtp(email, otp) {
  const subject = 'Reset your Spotify Clone Password';
  const title = 'Password Reset Code';
  const greeting = email;
  const messageBody = 'We received a request to reset your password. Please use the 6-digit code below to reset your password. This code is valid for 10 minutes.';
  const codeHtml = `
    <div class="code-container">
      <div class="code">${otp}</div>
    </div>
  `;
  const html = getEmailHtml(title, greeting, messageBody, codeHtml);
  return sendMail(email, subject, html, `Reset OTP: ${otp}`);
}

async function sendResetLink(email, link) {
  const subject = 'Reset your Spotify Clone Password';
  const title = 'Password Reset Link';
  const greeting = email;
  const messageBody = 'We received a request to reset your password. You can reset it directly by clicking the button below. This link is valid for 1 hour.';
  const buttonHtml = `
    <div class="btn-container">
      <a href="${link}" class="btn" target="_blank" style="color: #000000 !important;">Reset Password</a>
    </div>
    <p style="font-size: 12px; word-break: break-all; text-align: center; color: #727272; margin-top: 20px;">
      Or copy and paste this link in your browser:<br>
      <a href="${link}" style="color: #1ED760;">${link}</a>
    </p>
  `;
  const html = getEmailHtml(title, greeting, messageBody, buttonHtml);
  return sendMail(email, subject, html, `Reset Link: ${link}`);
}

async function sendMail(to, subject, html, logMessage) {
  const transporter = getTransporter();
  
  if (!transporter) {
    // Mock Mode
    console.log('\n================== [MOCK EMAIL SERVICE] ==================');
    console.log(`To:      ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Log:     ${logMessage}`);
    console.log('==========================================================\n');
    return {
      mocked: true,
      message: `Mock email sent to ${to}. ${logMessage}`,
    };
  }

  const fromEmail = process.env.SMTP_FROM_EMAIL || 'no-reply@spotify-clone.com';
  
  const mailOptions = {
    from: `"Spotify Clone" <${fromEmail}>`,
    to,
    subject,
    html,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email successfully sent to ${to}. Message ID: ${info.messageId}`);
    return {
      success: true,
      messageId: info.messageId,
    };
  } catch (error) {
    console.error(`Error sending email to ${to}:`, error);
    throw error;
  }
}

module.exports = {
  sendVerificationOtp,
  sendResetOtp,
  sendResetLink,
};
