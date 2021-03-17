var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
var jwt = require('jsonwebtoken');
let JSEncrypt = require('node-jsencrypt');
require('dotenv').config();

const RegistrationModel = require('../models/registration-model');
const UserModel = require('../models/user-model');
const {
  sendRegisterConfirmationEmail,
  sendRegistrationCompleteEmail,
  sendValidPasswordResetRequest,
  sendInValidPasswordResetRequest
} = require('../emails/email');
const {
  authenticateToken,
  authenticateAnonymous,
  tokenValidate
} = require('./authenticate-token');
const ROLES = require('../enums/roles');
const logger = require('../logger');

//Set up default mongoose connection
const mongoDB = 'mongodb://localhost:27017/ZANet-projector';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

const decrypt = function(data) {
  var _decrypt = new JSEncrypt();
  _decrypt.setPrivateKey(process.env.PRIVATE_KEY);
  return _decrypt.decrypt(data);
};
// todo: add this site uses cookies
router.post(
  '/submit',
  authenticateAnonymous,
  function(req, res, next) {

    // todo: ip checks
    // block source requests by ip
    
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      const decrypted = jwt.verify(token, 'anonymous');
      const id = new ObjectID();
      const reg_token = jwt.sign({ userId: id }, process.env.COMPLETING_REGISTRATION_KEY);
      let user = {
        _id: id,
        firstName: req.body.firstName,
        surname: req.body.surname,
        email: req.body.email,
        number: req.body.number,
        role: req.body.role,
        token: reg_token
      };

      RegistrationModel.find({ email: user.email }, function (err, docs) {
        if (docs.length === 0) {
          
          var user_instance = new RegistrationModel(user);
          user_instance.save(function (err) {
            if (err) return res.sendStatus(500, {error: err});
            sendRegisterConfirmationEmail(user);
            log('Submit registration', user.email, user._id, decrypted.anonymous);
            return res.send(user);
          });
        } else if (docs[0].status === 'removed') {
          return res.sendStatus(500, { error: 'A user with this email has been removed from the system' });
        } else {
          return res.sendStatus(401);
        }
      });

    } catch(e) {
      error('Failed to submit registration', token, req.body, e);
      res.sendStatus(500, {error: e});
    }
  }
);

router.post(
  '/complete-registration',
  tokenValidate,
  function (req, res, next) {
    try {
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1];
      const decrypted = jwt.verify(token, process.env.COMPLETING_REGISTRATION_KEY);

      if (!req.body.password) return res.sendStatus(500, {error: 'No password specified'});
    
      RegistrationModel.findById(decrypted.userId, function (err, doc) {
        if (err) return res.sendStatus(500, {error: err});
    
        let user = doc.toJSON();
        if (user) {
          const password = req.body ? req.body.password : null;
          user.token = null;
          user.token = jwt.sign(user, process.env.COMPLETE_KEY);
          user.password = password;
          user.permissions = user.role === ROLES.ADMIN;

          doc.status = 'registration-complete';
          doc.save();
            
          const user_instance = new UserModel(user);
          user_instance.save(function (err) {
            if (err) return res.sendStatus(500, {error: err});
            sendRegistrationCompleteEmail(user);
            //todo: send registration complete email to admin > authenticate user
            log('Registration Complete', user.email);
            return res.sendStatus(200);
          });
        } else {
          return res.sendStatus(401)
        }
      });
    } catch(e) {
      error('Failed to complete registration', token, req.body, e);
      res.sendStatus(500, {error: e});
    }
  }
);

router.post(
  '/authenticate',
  authenticateAnonymous,
  function (req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      const email = req.body ? req.body.email : null;
      const password = req.body ? req.body.password : null;
      if (!token || email == null) return res.sendStatus(401);

      UserModel
        .find({ email })
        .select({ token: 1, role: 1, password: 1, permissions: 1 }) // todo: check for other data mappings
        .then(function (docs, err) {
          if (err || !docs || docs.length == 0) return res.sendStatus(401, {error: err});

          let user = docs[0].toJSON();
          if (user && decrypt(password) === decrypt(user.password)) {
            delete user.password;
            log('User authenticated', email);
            return res.send(user);
          }
          return res.sendStatus(401)
        })
        .catch(e => {
          return res.sendStatus(500, {error: e})
        });

    } catch(e) {
      error('Failed to authenticate login', token, req.body, e);
      return res.sendStatus(500, {error: e})
    }
  }
);

router.post('/authenticate-token',
  (req, res, next) => authenticateToken(req, res, next),
  function(req, res, next) {

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    try {
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);
      const email = decrypted.email;
      UserModel.find({ email }, function (err, docs) {
        if (err || docs.length == 0) return res.sendStatus(500, {error: 'No email specified.'});
        log('Token authenticated', email);
        return res.sendStatus(200);
      });
    } catch(e) {
      error('Failed to authenticate token', token, req.body, e);
      return res.sendStatus(200)
    }
  }
);

router.post('/reset-password',
  authenticateAnonymous,
  function (req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    console.log(' ::>>> token >>> ', token);
    if (!token) return res.sendStatus(401);

    try {
      let user = {
        email: req.body.email
      };

      UserModel.find(user, function (err, docs) {
        if (err || docs.length == 0) {
          // todo: check for duplicate entities
          sendInValidPasswordResetRequest(user);
          error('Confirm password reset token is invalid', token);
        } else {
          user._id = docs[0]._id;
          let date = new Date();
          date.setHours(date.getHours() + 1);
          user.validBy = date;
          user.token = jwt.sign(user, process.env.PASSWORD_RESET_KEY);

          sendValidPasswordResetRequest(user);
          log('Confirm password reset token is valid', token);
        }
        return res.sendStatus(200);
      });
    } catch(e) {
      error('Failed to authenticate token', token, req.body, e);
      return res.sendStatus(500, {error: e})
    }
  }
);

router.put('/reset-password',
(req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN, ROLES.JOURNALIST, ROLES.VOICE_OVER, ROLES.DEFAULT_USER]),
  function (req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      const password = req.body.password;
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);
      if (!password || !decrypted) return res.sendStatus(500);

      // todo: pull verify, sign key into enums + 20 digit encryption
      UserModel.findById(decrypted._id, function (err, doc) {
        if (err) {
          error('Confirm password reset | user not found', null, token, err);
          return res.sendStatus(204, {error: err});
        }
        if (doc) {
          doc.password = password;
          doc.save();

          sendPasswordReset(user);
          log('Confirm password reset', token);
          return res.sendStatus(200);
        }
        return res.sendStatus(500, {error: err});
      });
    } catch(e) {
      error('Confirm password reset', null, token, e);
      return res.sendStatus(500, {error: e});
    }
  }
);

router.post('/token',
  authenticateAnonymous,
  function (req, res, next) {
    const token = req.body.token;
    if (!token) return res.sendStatus(500);

    try {
      const decrypted = jwt.verify(token, process.env.PASSWORD_RESET_KEY);
      // todo: check best server-side date implementation

      const dateToCheck = new Date(decrypted.validBy);
      const currentDate = new Date();

      if (!decrypted.validBy || dateToCheck.getTime() < currentDate.getTime()) {
        return res.sendStatus(500, {error: 'Not valid time'});
      }

      UserModel.findById(decrypted._id, function (err, doc) {
        if (err) {
          error('Password reset token auth failed | user not found', token, null, err);
          return res.sendStatus(500, {error: err});
        }
        if (doc) {
          log('Confirm password reset token is valid', token);
          return res.send(doc.token);
        }
        return res.sendStatus(500);
      });
    } catch(e) {
      console.log(' ::>> error ', e);
      error('Confirm password reset token error', null, token, e);
      return res.sendStatus(500, {error: e});
    }
  }
);

const log = function(message, email, userId, decrypted) {
  logger.info(message, {
    email,
    userId,
    decrypted,
    domain: 'passport'
  });
}

const error = function(message, token, body, error) {
  logger.error(message, {
    token,
    body,
    error: Object.getOwnPropertyDescriptors(new Error(error)).message,
    domain: 'passport'
  });
}

module.exports = router;
