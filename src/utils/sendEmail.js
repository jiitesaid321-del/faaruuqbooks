const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.SMTP_EMAIL,
    pass: process.env.SMTP_PASSWORD,
  },
});

async function sendEmail(to, subject, text) {
  return transporter.sendMail({
    from: `"Faaruuq Bookshop" <${process.env.SMTP_EMAIL}>`,
    to,
    subject,
    text,
  });
}

module.exports = sendEmail;
