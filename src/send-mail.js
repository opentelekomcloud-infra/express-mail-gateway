"use strict";
require("dotenv").config();
const { constants } = require("buffer");
const nodemailer = require("nodemailer");
const ejs = require('ejs');
const path = require("path");
/**
 * sendEmail
 * @param {Object} mailObj - Email information
 * @param {String} from - Email address of the sender
 * @param {Array} to - Array of receipents email address
 * @param {String} subject - Subject of the email
 * @param {String} text - Email body
 */
const sendEmail = async (mailObj, captcha_token, captcha_sitekey) => {
  const { from, to, subject, message } = mailObj;

  // Validate Captcha
  try {
    const postData = {
      token: captcha_token,
      key: captcha_sitekey,
      secret: process.env.MCAPTCHA_SECRET
    };

    const response = await fetch('https://mcaptcha.strapi.schreiber-ling.de/api/v1/pow/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(postData)
    });

    if (!response.ok) {
      throw new Error('Captcha response was not ok');
    }

    const data = await response.json();
    if (data["valid"] !== true) {
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

    const templatePath = path.resolve(__dirname, "../template/mail.html")
    let templateData = {
      welcomeMessage: "Hello!",
      requestBody: message
    }

    let templateRendered = ""

    ejs.renderFile(templatePath, templateData, {}, (err, str) => {
      if (err) {
        console.error(err);
      } else {
        templateRendered = str // Output: Rendered HTML content
      }
    });

    // send mail with defined transport object
    let info = await transporter.sendMail({
      from: from, // sender address
      to: to, // list of receivers
      subject: subject, // Subject line
      text: String(message), // plain text body
      html: templateRendered, // html body
    });

    // console.log(`Message sent: ${info.messageId}`);
    return {
      status: "success",
      data: null
    };
    return `Mail successfully sent with id: ${info.messageId}`;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Something went wrong in the sendmail method. Error: ${error.message}`
    );
  }
};

module.exports = sendEmail;
