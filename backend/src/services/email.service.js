import env from '../config/env.js';

const emailService = {
  /**
   * Send account verification OTP email for signup
   * @param {Object} options
   * @param {string} options.toEmail
   * @param {string} options.toName
   * @param {string} options.otp
   */
  async sendSignupOtpEmail({ toEmail, toName, otp }) {
    const serviceId = env.EMAILJS_SERVICE_ID;
    const templateId = env.EMAILJS_TEMPLATE_ID;
    const publicKey = env.EMAILJS_PUBLIC_KEY;
    const privateKey = env.EMAILJS_PRIVATE_KEY;

    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      console.log(`[EMAIL DEV LOG] Signup verification OTP for ${toEmail}: ${otp}`);
    }

    if (!serviceId || !templateId || !publicKey) {
      console.warn('[EMAIL SERVICE] EmailJS configuration is missing serviceId, templateId, or publicKey.');
      return { sent: false, reason: 'EmailJS credentials not configured' };
    }

    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_name: toName || 'User',
          to_email: toEmail,
          email: toEmail,
          user_email: toEmail,
          otp,
          code: otp,
          reset_code: otp,
          passcode: otp,
          message: `Your viMeet account verification code is: ${otp}. It will expire in 10 minutes. Please enter this code to complete your registration.`,
        },
      };

      if (privateKey) {
        payload.accessToken = privateKey;
      }

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'viMeet-Backend/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EMAIL SERVICE] EmailJS API error:', response.status, errorText);
        return { sent: false, error: errorText };
      }

      console.log(`[EMAIL SERVICE] Signup verification OTP email successfully sent to ${toEmail}`);
      return { sent: true };
    } catch (error) {
      console.error('[EMAIL SERVICE] Network or fetch error sending email via EmailJS:', error.message);
      return { sent: false, error: error.message };
    }
  },

  /**
   * Send a password reset email using EmailJS REST API
   * @param {Object} options
   * @param {string} options.toEmail
   * @param {string} options.toName
   * @param {string} options.resetCode
   */
  async sendPasswordResetEmail({ toEmail, toName, resetCode }) {
    const serviceId = env.EMAILJS_SERVICE_ID;
    const templateId = env.EMAILJS_TEMPLATE_ID;
    const publicKey = env.EMAILJS_PUBLIC_KEY;
    const privateKey = env.EMAILJS_PRIVATE_KEY;

    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      console.log(`[EMAIL DEV LOG] Password reset code for ${toEmail}: ${resetCode}`);
    }

    if (!serviceId || !templateId || !publicKey) {
      console.warn('[EMAIL SERVICE] EmailJS configuration is missing serviceId, templateId, or publicKey.');
      return { sent: false, reason: 'EmailJS credentials not configured' };
    }

    try {
      const payload = {
        service_id: serviceId,
        template_id: templateId,
        user_id: publicKey,
        template_params: {
          to_name: toName || 'User',
          to_email: toEmail,
          email: toEmail,
          user_email: toEmail,
          reset_code: resetCode,
          code: resetCode,
          passcode: resetCode,
          message: `Your viMeet password reset verification code is: ${resetCode}. It will expire in ${env.RESET_TOKEN_EXPIRY_MINUTES || 15} minutes. If you did not request this, please ignore this email.`,
        },
      };

      if (privateKey) {
        payload.accessToken = privateKey;
      }

      const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'viMeet-Backend/1.0',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[EMAIL SERVICE] EmailJS API error:', response.status, errorText);
        return { sent: false, error: errorText };
      }

      console.log(`[EMAIL SERVICE] Password reset email successfully sent to ${toEmail}`);
      return { sent: true };
    } catch (error) {
      console.error('[EMAIL SERVICE] Network or fetch error sending email via EmailJS:', error.message);
      return { sent: false, error: error.message };
    }
  },
};

export default emailService;
