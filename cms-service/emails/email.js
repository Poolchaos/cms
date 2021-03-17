const express = require("express");
const nodemailer = require('nodemailer');
const fs = require('fs')
const path = require('path')
const logger = require('../logger');

const CONFIRM_REGISTRATION = fs.readFileSync(path.resolve(__dirname, './email-confirm-registration.html'), 'utf8');
const REGISTRATION_COMPLETED = fs.readFileSync(path.resolve(__dirname, './email-registration-complete.html'), 'utf8');
const PURCHASE_CONFIRMED = fs.readFileSync(path.resolve(__dirname, './email-purchase.html'), 'utf8');
const PURCHASE_TEMPLATE = fs.readFileSync(path.resolve(__dirname, './email-purchase-template.html'), 'utf8');

const REQUEST_PASSWORD_RESET_VALID = fs.readFileSync(path.resolve(__dirname, './email-password-reset-request-valid.html'), 'utf8');
const REQUEST_PASSWORD_RESET_INVALID = fs.readFileSync(path.resolve(__dirname, './email-password-reset-request-invalid.html'), 'utf8');
const PASSWORD_RESET = fs.readFileSync(path.resolve(__dirname, './email-password-reset.html'), 'utf8');

// todo: format all dates like this >>> info: Confirm registration email sent {"date":1613982736471,"email":"flaap4@zailab.com","userId":"60336c8c16144c0684353523","domain":"email"}

var transporter = nodemailer.createTransport({
  host: "smtp.mailtrap.io",
  port: 2525,
  auth: {
    user: "37195f8d35d947", // todo: move to dontenv
    pass: "56a6b4f73e969c"
  }
});

function sendRegisterConfirmationEmail(user) {
  
  let mailData = {
    from: 'noreply@ZANet.com',
    to: user.email,
    subject: 'noreply',
    html: CONFIRM_REGISTRATION.replace(/\$\{ZANet_token\}/gi, user.token)
  };

  transporter.sendMail(mailData, function (err, info) {
    if(err) {
      error('Failed to send registration confirmation email', user.email, user._id, e);
    } else {
      log('Confirm registration email sent', user.email, user._id);
    }
  });
}

function sendRegistrationCompleteEmail(user) {
  
  let mailData = {
    from: 'noreply@ZANet.com',
    to: user.email,
    subject: 'noreply',
    html: REGISTRATION_COMPLETED
  };

  transporter.sendMail(mailData, function (err, info) {
    if(err) {
      error('Failed to send complete registration email', user.email, user._id, err);
    } else {
      log('Registration completed email sent', user.email, user._id);
    }
  });
}

function sendValidPasswordResetRequest(user) {
  
  let mailData = {
    from: 'noreply@ZANet.com',
    to: user.email,
    subject: 'noreply',
    html: REQUEST_PASSWORD_RESET_VALID.replace('${ZANet_token}', user.token)
  };

  transporter.sendMail(mailData, function (err, info) {
    if(err) {
      error('Failed to send request password reset email', user.email, user._id, err);
    } else {
      log('Request password reset email sent', user.email, user._id);
    }
  });
}

function sendInValidPasswordResetRequest(user) {
  
  let mailData = {
    from: 'noreply@ZANet.com',
    to: user.email,
    subject: 'noreply',
    html: REQUEST_PASSWORD_RESET_INVALID
  };

  transporter.sendMail(mailData, function (err, info) {
    if(err) {
      error('Failed to send request password reset email', user.email, null, err);
    } else {
      log('Request password reset email sent', user.email);
    }
  });
}

function sendPasswordReset(user) {
  
  let mailData = {
    from: 'noreply@ZANet.com',
    to: user.email,
    subject: 'noreply',
    html: PASSWORD_RESET
  };

  transporter.sendMail(mailData, function (err, info) {
    if(err) {
      error('Failed to send request password reset email', user.email, null, err);
    } else {
      log('Password reset email sent', user.email);
    }
  });
}

function sendPurchasedEmail(user, articles) {

  let _articles = '';
  if (articles && Array.isArray(articles)) {
    articles.forEach(item => {
      let template = PURCHASE_TEMPLATE;
      template = template.replace('${name}', item.name);
      template = template.replace('${category}', item.category);
      template = template.replace('${content}', item.content);

      _articles += template;
    });
  }

  let template = PURCHASE_CONFIRMED.replace('${purchases}', _articles);
  
  let mailData = {
    from: 'noreply@ZANet.com',
    to: user.email,
    subject: 'noreply',
    html: template,
  };

  transporter.sendMail(mailData, function (err, info) {
    if(err) {
      error('Failed to send purchase email', user.email, user._id, err);
    } else {
      log('Purchase email sent', user.email, user._id);
    }
  });
}

// todo: make all links in emails safe via google

const log = function(message, email, userId) {
  logger.info(message, {
    email,
    userId,
    domain: 'email'
  });
}

const error = function(message, email, userId, error) {
  logger.error(message, {
    email,
    userId,
    error: Object.getOwnPropertyDescriptors(new Error(error)).message,
    domain: 'email'
  });
}

module.exports = {
  sendRegisterConfirmationEmail,
  sendRegistrationCompleteEmail,
  sendPurchasedEmail,
  sendValidPasswordResetRequest,
  sendInValidPasswordResetRequest,
  sendPasswordReset
};