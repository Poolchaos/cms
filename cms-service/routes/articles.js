var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
require('dotenv').config();

const { authenticateToken } = require('./authenticate-token');
const ArticleModel = require('../models/article-model');
const ROLES = require('../enums/roles'); // todo: change all default exports to named exports
const CATEGORIES = require('../enums/categories');
const logger = require('../logger');

//Set up default mongoose connection
const mongoDB = 'mongodb://localhost:27017/ZANet-projector';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

router.get('/',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.JOURNALIST]),
  function(req, res, next) {
    try {
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1];
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted) return res.sendStatus(401);
      // todo: map response > only show created, reviewer for admins
      // todo: add podCast to articles
      ArticleModel.find({ 'created.userId': decrypted._id }, function (err, docs) {
        return res.send(docs);
      });
    } catch(e) {
      console.log(' ::>> error ', e);
      return res.sendStatus(500);
    }
  }
);

router.get('/edit',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.JOURNALIST]),
  function(req, res, next) {
    try {
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1];
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted) return res.sendStatus(401);
      if (!req.query || !req.query.articleId) return res.sendStatus(500);

      const params = {
        _id: req.query.articleId,
        'created.userId': decrypted._id
      };

      ArticleModel.find(params, function (err, docs) {
        if (!docs || docs.length === 0) {
          return res.sendStatus(404);
        }

        return res.send(docs[0]);
      });
    } catch(e) {
      console.log(' ::>> error ', e);
      return res.sendStatus(500);
    }
  }
);

router.get('/review',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN]),
  function(req, res, next) {
    try {
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1];
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted) return res.sendStatus(401);

      ArticleModel.find({ contentConfirmed: false }, function (err, docs) {
        return res.send(docs);
      });
    } catch(e) {
      console.log(' ::>> error ', e);
      return res.sendStatus(500);
    }
  }
);

router.get('/category',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN, ROLES.JOURNALIST, ROLES.DEFAULT_USER]),
  function(req, res, next) {
    try {
      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1];
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted) return res.sendStatus(401);
      if (!req.query.category) return res.sendStatus(500, 'No category specified');
      if (!CATEGORIES.includes(req.query.category)) return res.sendStatus(500);

      const params = {
        category: req.query.category,
        contentConfirmed: true
      };
      ArticleModel.find(params, function (err, docs) {
        return res.send(docs);
      });
    } catch(e) {
      console.log(' ::>> error ', e);
      return res.sendStatus(500);
    }
  }
);

router.post('/', 
  (req, res, next) => authenticateToken(req, res, next, [ROLES.JOURNALIST]),
  function(req, res, next) {
    try {
      if (!req.body) return res.sendStatus(500, { error: err });

      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1];
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted) return res.sendStatus(401);
      const article = {
        _id: new ObjectID(),
        name: req.body.name,
        category: req.body.category,
        content: req.body.content,
        created: {
          userId: decrypted._id,
          timestamp: Date.now()
        },
        contentConfirmed: false
      };

      var instance = new ArticleModel(article);
      instance.save(function (err) {
        // todo: handle errors passed through to FE
        if (err) {
          console.log(' ::>> error ', err);
          return res.sendStatus(500, {error: err});
        }
        log('Article created', article._id, article.userId);
        return res.send({ articleId: article._id });
      });

    } catch(e) {
      error('Failed to create article', token, req.body, e);
      return res.sendStatus(500, { error: err });
    }
  }
);

router.put('/', 
  (req, res, next) => authenticateToken(req, res, next, [ROLES.JOURNALIST]),
  function(req, res, next) {
    try {
      if (!req.body) return res.sendStatus(500, { error: err });

      const authHeader = req.headers['authorization']
      const token = authHeader && authHeader.split(' ')[1];
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted) return res.sendStatus(401);

      ArticleModel.findById(req.body.articleId, function (err, doc) {
        if (err) return res.sendStatus(500, {error: err});

        doc.name = req.body.name;
        doc.category = req.body.category;
        doc.content = req.body.content;
        doc.updated.addToSet({
          userId: decrypted._id,
          timestamp: Date.now()
        });
        doc.save();

        log('Article created', req.body.articleId, decrypted._id);
        return res.send({ articleId: req.body.articleId });
      });

    } catch(e) {
      error('Failed to create article', token, req.body, e);
      return res.sendStatus(500, { error: err });
    }
  }
);

router.post('/review', 
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted) return res.sendStatus(401);
      if (!req.body) return res.sendStatus(500, { error: err });
      
      ArticleModel.findById(req.body.articleId, function (err, doc) {
        if (err) return res.sendStatus(500, {error: err});

        doc.contentConfirmed = true;
        doc.reviewer = {
          userId: decrypted._id,
          timestamp: Date.now()
        };
        doc.save();

        log('Article reviewed', req.body.articleId, decrypted._id);
        return res.send({ articleId: req.body.articleId });
      });


    } catch(e) {
      error('Failed to review article', token, req.body, e);
      return res.sendStatus(500, { error: err });
    }
  }
);

router.delete('/',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.JOURNALIST]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

      if (!decrypted || !req.body.articleId) return res.sendStatus(401);

      ArticleModel.deleteOne(
        { _id: req.body.articleId },
        function (err) {
          if (err) return res.sendStatus(500, { error: err });
          log('Article removed', req.body.articleId, decrypted._id);
          return res.sendStatus(200);
        }
      );
    } catch(e) {
      error('Failed to delete article', token, req.body, e);
      return res.sendStatus(500);
    }
  }
);

const log = function(message, articleId, userId) {
  logger.info(message, {
    articleId,
    userId,
    domain: 'articles'
  });
}

const error = function(message, token, body, error) {
  logger.error(message, {
    token,
    body,
    error: Object.getOwnPropertyDescriptors(new Error(error)).message,
    domain: 'articles'
  });
}

module.exports = router;
