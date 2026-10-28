const express = require("express");
const router = express.Router();
const sendMailMethod = require("../src/send-mail");
const querystring = require("querystring");
require("dotenv").config();

const MAX_FROM_LENGTH = 254;
const MAX_SUBJECT_LENGTH = 200;
const MAX_MESSAGE_LENGTH = 10000;

/**
 * Returns the size of the message payload in characters.
 * @param {string|Object} message - Message body
 * @returns {number} Payload length
 */
function getMessageLength(message) {
  if (typeof message === "string") {
    return message.length;
  }
  if (message === null || message === undefined) {
    return 0;
  }
  return JSON.stringify(message).length;
}

// Post request to send an email
router.post("/sendmail", async (req, res) => {
  try {
    const email_to_raw = process.env.MAIL_RECIPIENT
    const email_to = email_to_raw.split(',');
    const email_from = process.env.MAIL_FROM || "no-reply@otc-service.com";

    // Validate required fields
    if (!req.body["subject"] || !req.body["message"] || !req.body["from"]) {
      res.status(400).json({
        status: "fail",
        message: "Subject, from and message are required fields.",
      });
      return;
    }

    if (
      String(req.body["from"]).length > MAX_FROM_LENGTH ||
      String(req.body["subject"]).length > MAX_SUBJECT_LENGTH ||
      getMessageLength(req.body["message"]) > MAX_MESSAGE_LENGTH
    ) {
      res.status(400).json({
        status: "fail",
        message: "From, subject or message exceeds the maximum allowed length.",
      });
      return;
    }

    if (!req.body["captcha_token"]) {
      res.status(400).json({
        status: "fail",
        message: "Captcha token is required.",
      });
      return;
    }

    let email_request = {}
    email_request["to"] = email_to
    // The visible sender is fixed so the API cannot be used to impersonate
    // an arbitrary address. The requester's address becomes Reply-To.
    email_request["from"] = email_from
    email_request["reply_to"] = req.body["from"]
    email_request["subject"] = req.body["subject"]
    email_request["message"] = req.body["message"]
    captcha_token = req.body["captcha_token"]

    const result = await sendMailMethod(email_request, captcha_token);

    if (result["status"] !== "success") {
      res.json({
        status: "fail",
        message: result["message"],
      });
    } else {
      res.json({
        status: "success",
        data: null,
      });
    }
  } catch (error) {
    console.error(error.message);
    res.status(500).json({
      status: "error",
      message: "Something went wrong in Sendmail Route.",
    });
  }
});

module.exports = router;
