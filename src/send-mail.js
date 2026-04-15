"use strict";
require("dotenv").config();
const { constants } = require("buffer");
const nodemailer = require("nodemailer");
const ejs = require('ejs');
const path = require("path");
const sanitizeHtml = require('sanitize-html');

/**
 * Sanitizes input to prevent XSS attacks
 * @param {string} input - Input to sanitize
 * @returns {string} Sanitized input
 */
function sanitizeInput(input) {
    if (typeof input !== 'string') {
        if (input === null || input === undefined) {
            return '';
        }
        return String(input);
    }
    return sanitizeHtml(input, {
        allowedTags: [],
        allowedAttributes: {},
        disallowedTagsMode: 'discard'
    });
}

/**
 * Validates email format and checks for header injection
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid
 */
function validateEmailFormat(email) {
    if (typeof email !== 'string') return false;
    if (email.includes('\n') || email.includes('\r')) {
        return false;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
}

/**
 * Validates subject line to prevent header injection
 * @param {string} subject - Subject to validate
 * @returns {boolean} True if valid
 */
function validateSubject(subject) {
    if (typeof subject !== 'string') return false;
    return !subject.includes('\n') && !subject.includes('\r');
}

/**
 * Sanitizes message object fields
 * @param {Object} message - Message object
 * @returns {Object} Sanitized message object
 */
function sanitizeMessage(message) {
    const sanitized = {};
    for (const [key, value] of Object.entries(message)) {
        if (key === 'cap-token') continue;
        sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
}

/**
 * Validates CAPTCHA token against the remote CAPTCHA server
 * @param {string} token - The CAPTCHA token to validate
 * @returns {Promise<Object>} Validation result with success boolean
 */
async function validateCaptchaToken(token) {
    if (!token) {
        return { success: false, error: "Missing token" };
    }

    const captchaUrl = process.env.CAPTCHA_URL;
    const sitekey = process.env.CAPTCHA_SITEKEY;
    const secretKey = process.env.CAPTCHA_SECRET_KEY;

    if (!secretKey || !sitekey || !captchaUrl) {
        console.error("URL or keys not configured in environment variables");
        return { success: false, error: "Configuration error" };
    }

    try {
        const response = await fetch(`${captchaUrl}${sitekey}/siteverify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                secret: secretKey,
                response: token
            }),
            timeout: 5000
        });

        const result = await response.json();
        return result;
    } catch (error) {
        console.error("CAPTCHA validation request failed:", error.message);
        return { success: false, error: "Validation service unavailable" };
    }
}

/**
 * sendEmail
 * @param {Object} mailObj - Email information
 * @param {String} from - Email address of the sender
 * @param {Array} to - Array of receipents email address
 * @param {String} subject - Subject of the email
 * @param {String} text - Email body
 */
const sendEmail = async (mailObj, captcha_token) => {
  const { from, to, subject, message } = mailObj;

  if (!validateEmailFormat(from)) {
    return {
      status: "fail",
      message: "Invalid email format."
    };
  }

  if (!validateSubject(subject)) {
    return {
      status: "fail",
      message: "Invalid subject format."
    };
  }

  try {
    const result = await validateCaptchaToken(captcha_token);

    if (!result.success) {
      return {
        status: "fail",
        message: "Captcha verification failed!"
      };
    }

  } catch (error) {
    console.error(error);
    throw new Error(
      `Something went wrong in the captcha verification. Error: ${error.message}`
    );
  }

  try {
    // Create a transporter
    let transporter = nodemailer.createTransport({
      host: process.env.SMTP_DOMAIN,
      port: Number(process.env.SMTP_PORT),
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const emailMessage = sanitizeMessage(message);

    const templatePath = path.resolve(__dirname, "../template/mail.html")
    let templateData = {
      welcomeMessage: "Hello!",
      requestBody: emailMessage
    }

    let templateRendered = ""

    await new Promise((resolve, reject) => {
      ejs.renderFile(templatePath, templateData, {}, (err, str) => {
        if (err) {
          console.error(err);
          reject(err);
        } else {
          templateRendered = str
          resolve(str);
        }
      });
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: from, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: String(emailMessage), // plain text body
      html: templateRendered, // html body
    });

    return {
      status: "success",
      data: null
    };

  } catch (error) {
    console.error(error);
    throw new Error(
      `Something went wrong in the sendmail method. Error: ${error.message}`
    );
  }
};

module.exports = sendEmail;
