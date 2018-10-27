'use strict';

const nodemailer = require('nodemailer');
const { SMTP_CONFIG } = require('../../config/config');

function sendEmail(to, subject, text) {

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
    auth: {
      ...SMTP_CONFIG
    }
  });

  // setup email data with unicode symbols
  let mailOptions = {
    to,
    subject,
    text
  };

  // send mail with defined transport object
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return console.log(error);
    }
    console.log('Message sent: %s', info.messageId);
    // Preview only available when sending through an Ethereal account
    console.log('Preview URL: %s', nodemailer.getTestMessageUrl(info));
  });
}

module.exports = sendEmail;