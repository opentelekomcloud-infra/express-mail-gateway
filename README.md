# Express Mail Gateway

This nodejs (Express JS) application will be used as mail gateway to hide sensitive information from the frontend. It is built as API gateway which receives a post request and enriches the message with the sensitive data and forwards everything to the mail gateway via SMTP provider.

## Author

This repository was originally forked from :link: [schadokar/nodemailer-app](https://github.com/schadokar/nodemailer-app) and enhanced with a couple of code snippets and a [Cap](https://capjs.js.org/) CAPTCHA integration.

## Installation

Clone the repository to your local folder:

`git clone <reponame>`

Install the nodejs dependencies with npm.

`npm i`

## Configuration

Configure the application by using environment variables or a `.env` file with the following parameters.

```Shell
SMTP_USER=<SMTP_USER>
SMTP_PASS=<SMTP_PASSWORD>
SMTP_DOMAIN=<SMTP_DOMAIN>
SMTP_PORT=<Port to be used e.g. 25>
MAIL_RECIPIENT=List-of@mail-recipiens.com,
MAIL_FROM=no-reply@otc-service.com
CAPTCHA_URL=https://cap.example.com/
CAPTCHA_SITEKEY=your-site-key
CAPTCHA_SECRET_KEY=sk-you...here
CORS_ORIGINS=https://partners.otc-service.com
```

## Run the application

Dev mode:

```
npm run dev
```

Productive:

```
npm run start
```

## Sample API Request

`POST http://<hostname>:3000/api/v1/sendmail`

`REQUESTBODY`
```json
{
    "from": "requester@sample.com",
    "subject": "Subject for the mail",
    "message": {
        "test1":"test1Value",
        "test2":"test2Value"
    },
    "captcha_token": "yourretrievedtokenfromCap"
}
```

The `from` field is the requester's address and is used as `Reply-To`. The
visible sender is fixed to `MAIL_FROM` (default `no-reply@otc-service.com`).
