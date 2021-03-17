var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var jwt = require('jsonwebtoken');
require('dotenv').config();

const UserModel = require('../models/user-model');
const { authenticateToken } = require('./authenticate-token');
const RegistrationModel = require('../models/registration-model');
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

const removeUser = function(req, res) {
  const userId = req.body.userId;
  UserModel.deleteOne(
    { _id: userId },
    function (err) {
      if (err) return res.sendStatus(500, { error: err });
      return updateRegistration(req, res, userId)
    }
  );
}

const updateRegistration = function(req, res, userId) {
  RegistrationModel.findById(userId, function (err, doc) {
    if (err) return res.sendStatus(500, {error: err});
    doc.status = 'removed';
    doc.save();

    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) return res.sendStatus(401);

    const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);
    log('User removed', decrypted.email, userId);
    return res.sendStatus(200);
  });
}

/* GET users listing. */
router.get('/',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN]),
  function(req, res, next) {
    try {
      UserModel.find({}, function (err, docs) {
        return res.send(docs);
      });
    } catch(e) {
      console.log(' ::>> error ', e);
    }
  }
);

router.delete('/',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    
    try {
      if (!req.body || !req.body.userId) {
        return res.sendStatus(500, { error: err });
      }
      return removeUser(req, res);
    } catch(e) {
      error('Failed to delete user', token, req.body, e);
      return res.sendStatus(500);
    }
  }
);

router.put('/enable',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    
    try {
      if (!req.body || !req.body.userId) return res.sendStatus(500, { error: err });

      UserModel.findById(req.body.userId, function (err, doc) {
        doc.permissions = true;
        doc.save();
        log('Enable user access', token, req.body);
        return res.send({ userId: doc._id, permissions: doc.permissions });
      });
    } catch(e) {
      error('Failed to enable user access', token, req.body, e);
      return res.sendStatus(500);
    }
  }
);

router.put('/disable',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    
    try {
      if (!req.body || !req.body.userId) return res.sendStatus(500, { error: err });

      UserModel.findById(req.body.userId, function (err, doc) {
        doc.permissions = false;
        doc.save();
        log('Disable user access', token, req.body);
        return res.send({ userId: doc._id, permissions: doc.permissions });
      });
    } catch(e) {
      error('Failed to disable user access', token, req.body, e);
      return res.sendStatus(500);
    }
  }
);

const log = function(message, email, removedUser) {
  logger.info(message, {
    email,
    removedUser,
    domain: 'users'
  });
}

const error = function(message, token, body, error) {
  logger.error(message, {
    token,
    body,
    error: Object.getOwnPropertyDescriptors(new Error(error)).message,
    domain: 'users'
  });
}

module.exports = router;
