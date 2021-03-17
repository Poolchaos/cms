var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
const fs = require('fs');
require('dotenv').config();

const { authenticateToken } = require('./authenticate-token');
const ArticleModel = require('../models/article-model');
const FileModel = require('../models/file-model');
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

router.post('/',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.JOURNALIST]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      //todo: move to enum
      const acceptedTypes = ['audio/wav', 'audio/mpeg'];
      if (!req.body.type || !acceptedTypes.includes(req.body.type)) return res.sendStatus(500);
      if (!req.body) return res.sendStatus(500, { error: err });
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      const extention = req.body.name.split('.');
      const generatedName = new ObjectID();
      const audio = {
        _id: new ObjectID(),
        name: req.body.name,
        location: __dirname + `\\tmp\\${generatedName}.${extention[extention.length - 1]}`,
        type: req.body.type,
        articleId: req.body.articleId
      };
    
      fs.writeFileSync(audio.location, Buffer.from(req.body.data.replace(`data:${audio.type};base64,`, ''), 'base64'));

      var instance = new FileModel(audio);
      instance.save(function (err) {
        if (err) return res.sendStatus(500, {error: err});
        log('Audio uploaded', audio._id, audio.articleId, decrypted._id);
        
        ArticleModel.findById(audio.articleId, function (err, doc) {
          if (err) return res.sendStatus(500, {error: err});
          if (!doc) return res.sendStatus(404, {error: 'Article not found'});
          doc.files.addToSet(audio._id);
          doc.save();

          log('Article reviewed', req.body.articleId, decrypted._id);
          return res.send({ articleId: req.body.articleId });
        });
      });

    } catch(e) {
      console.log(' ::>> err ', e);
      error('Failed to upload audio', token, req.body.type, e);
      return res.sendStatus(500, { error: err });
    }
  }
);

router.put('/', 
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN, ROLES.JOURNALIST]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      if (!req.body) return res.sendStatus(500, { error: err });
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);
      if (!decrypted) return res.sendStatus(401);

      FileModel.findById(req.body.audioId, function (err, doc) {
        if (doc) {
          fs.readFile(doc.location, (error, data) => {
            if (error) return res.sendStatus(500, { error });
            log('Streaming audio', req.body.audioId, decrypted._id);
            return res.send({
              type: doc.type,
              content: Buffer.from(data, 'binary').toString('base64')
            });
          });
        } else {
          return res.sendStatus(500, { error: 'File does not exist' });
        }
      });
    } catch(e) {
      error('Failed to stream audio', token, req.body, e);
      return res.sendStatus(500, { error: err });
    }
  }
);

const log = function(message, audioId, articleId, userId) {
  logger.info(message, {
    audioId,
    articleId,
    userId,
    domain: 'audio'
  });
}

const error = function(message, token, body, error) {
  logger.error(message, {
    token,
    body,
    error: Object.getOwnPropertyDescriptors(new Error(error)).message,
    domain: 'audio'
  });
}

module.exports = router;
