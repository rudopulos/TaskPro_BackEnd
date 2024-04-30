const nodemailer = require("nodemailer");

const { EMAIL_USERNAME, EMAIL_PASSWORD } = process.env;

const nodemailerConfig = {
  host: "smtp.office365.com",
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USERNAME,
    pass: EMAIL_PASSWORD,
  },
  tls: {
    ciphers: "SSLv3",
  },
};

const transport = nodemailer.createTransport(nodemailerConfig);

async function sendEmail(data) {
  const email = { ...data, from: EMAIL_USERNAME };
  await transport.sendMail(email);
  return true;
}

module.exports = sendEmail;
