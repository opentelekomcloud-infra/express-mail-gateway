const express = require("express");
const router = express.Router();
const sendMailMethod = require("../src/send-mail");
const querystring = require("querystring");
require("dotenv").config();

// Post request to send an email
router.post("/sendmail", async (req, res) => {
  try {
    const email_to_raw = process.env.MAIL_RECIPIENT
    const email_to = email_to_raw.split(',');

    // Validate required fields
    if (!req.body["subject"] || !req.body["message"] || !req.body["from"]) {
      res.status(400).json({
        status: "fail",
        message: "Subject, from and message are required fields.",
      });
      return;
    }

    let email_request = {}
    email_request["to"] = email_to
    email_request["from"] = req.body["from"]
    email_request["subject"] = req.body["subject"]
    email_request["message"] = req.body["message"]
    captcha_token = req.body["captcha_token"]
    captcha_sitekey = req.body["captcha_sitekey"]

    const result = await sendMailMethod(email_request, captcha_token, captcha_sitekey);

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
