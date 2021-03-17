var express = require('express');
var router = express.Router();
var jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const ObjectID = require('mongodb').ObjectID;
var async = require("async");
require('dotenv').config();

const { authenticateToken } = require('./authenticate-token');
const PurchaseModel = require('../models/purchase-model');
const ArticleModel = require('../models/article-model');
const FileModel = require('../models/file-model');
const UserModel = require('../models/user-model');
const ROLES = require('../enums/roles');
const logger = require('../logger');
const { sendPurchasedEmail } = require('../emails/email');

//Set up default mongoose connection
const mongoDB = 'mongodb://localhost:27017/ZANet-projector';
mongoose.connect(mongoDB, {useNewUrlParser: true, useUnifiedTopology: true});
mongoose.set('useFindAndModify', false);

//Get the default connection
var db = mongoose.connection;

//Bind connection to error event (to get notification of connection errors)
db.on('error', console.error.bind(console, 'MongoDB connection error:'));

router.post('/checkout', 
  (req, res, next) => authenticateToken(req, res, next, [ROLES.DEFAULT_USER]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      if (!req.body) return res.sendStatus(500, { error: err });
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);
      if (!decrypted) return res.sendStatus(401);

      const articleIds = req.body;
      if (!articleIds || !Array.isArray(req.body) || articleIds.length === 0) return res.sendStatus(204);

        function findArticle(articleId) {
          return new Promise((resolve, reject) => {
            ArticleModel.findById(articleId, function (err, doc) {
              if (doc) resolve(doc);
            });
          });
        }

        function findAudio(audioId) {
          return new Promise((resolve, reject) => {
            FileModel.findById(audioId, function (err, doc) {
              if (doc) resolve(doc);
            });
          });
        }

        function findFiles(article) {
          return new Promise(resolve => {
          
            if (article.files.length === 0) resolve(article);
            let filePromises = [];

            article.files.forEach(file => filePromises.push(findAudio(file)));
            Promise.all(filePromises).then((values) => {
              article.files = values;
              resolve(article);
            });
          })
        }

        function startWaterfall() {
          return async.parallel([
            (cb) => {
              async.waterfall([
                (callback) => {
                  let promises = [];
                  articleIds.forEach(articleId => promises.push(findArticle(articleId)));
                  
                  Promise.all(promises).then((values) => {
                    callback(null, values)
                  });
                },
                (articles, callback) => {
                  let articlePromises = [];
                  articles.forEach(article => articlePromises.push(findFiles(article)));

                  Promise.all(articlePromises).then((values) => {
                    callback(null, values)
                  });
                }
              ], function (err, articles, callback) {
                sendPurchasedEmail(decrypted, articles);
                cb();
              });
            },
            (cb) => {
              function updatePurchase(articleId) {
                return new Promise(resolve => {
                  const payload = {
                    _id: new ObjectID(),
                    articleId: articleId,
                    userId: decrypted._id,
                    date: Date.now()
                  };

                  var instance = new PurchaseModel(payload);
                  instance.save(function (err) {
                    if (err) return res.sendStatus(500, {error: err});
                    log('Article purchased', articleId, decrypted._id);
                    resolve();
                  });
                });
              }

              let promises = [];
              articleIds.forEach(articleId => promises.push(updatePurchase(articleId)));
              
              Promise.all(promises).then((values) => {
                cb(null, values)
              });

            }
          ], function (result) {
            return res.sendStatus(200);
          });
        }

        startWaterfall();
    } catch(e) {
      error('Failed to checkout cart', token, req.body, e);
      return res.sendStatus(500, { error: err });
    }
  }
);

router.get('/all',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN]),
  function(req, res, next) {
    try {

      function startWaterfall() {
        return async.waterfall([
          (cb) => {
            // get all purchases
            PurchaseModel.find({}, function (err, docs) {
              if (!err && docs) {
                cb(null, docs);
              }
            });
          },
          (purchases, cb) => {
            async.parallel([
              (callback) => {
                // get all purchased articles
                let count = 0;
                let map = {};

                purchases.forEach(purchase => {
                  const articleId = purchase.articleId;
                  if (map[articleId]) return;

                  // todo: Date type > ).sort({ date: 1 }).exec(
                    // todo: service listens for app dying
                  ArticleModel.findById(articleId, (err, doc) => {
                    if (!err && doc) {
                      map[articleId] = doc;
                      count++;

                      if (count >= purchases.length) {
                        return callback(null, map);
                      }
                    }
                  });
                });
              },
              (callback) => {
                // get purchasees
                let count = 0;
                let map = {};

                purchases.forEach(purchase => {
                  const userId = purchase.userId;
                  if (map[userId]) return;

                  UserModel.findById(userId, function (err, doc) {
                    if (!err && doc) {
                      map[userId] = doc;
                      count++;

                      if (count >= purchases.length) {
                        return callback(null, map);
                      }
                    }
                  });
                });
              }
            ], (err, result) => {
              const articles = result[0];
              const users = result[1];

              let mappedPurchases = [];

              function mapEntries(purchase) {
                let entry = {
                  _id: purchase._id,
                  date: purchase.date,
                  purchasee: null,
                  article: null
                };

                const article = articles[purchase.articleId];
                if (article) {
                  entry.article = article;
                }

                const user = users[purchase.userId];
                if (user) {
                  entry.user = user;
                }
                mappedPurchases.push(entry);
              }
              
              let promises = [];
              purchases.forEach(purchase => promises.push(mapEntries(purchase)));
              
              Promise.all(promises).then((values) => {
                cb(mappedPurchases);
              });

            })
          }
        ], function(result) {
          return res.send(result);
        });
      }
      
      startWaterfall();





      // PurchaseModel.find({}, function (err, docs) {
      //   let count = 0;
      //   let list = [];

      //   // todo: get each article
      //   // todo: get each user
      //   // todo: add paging

      //   docs.forEach(item => {
      //     ArticleModel.findById(item.articleId, function (err, doc) {
      //       if (err) return;
      //       list.push(doc);
      //       count++;
      //       if (count >= docs.length) {
      //         return res.send(list);
      //       }
      //     });
      //   });
      // });
    } catch(e) {
      console.log(' ::>> error ', e);
    }
  }
);

router.get('/',
  (req, res, next) => authenticateToken(req, res, next, [ROLES.ADMIN, ROLES.DEFAULT_USER]),
  function(req, res, next) {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];

    try {
      const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);
      if (!decrypted) return res.sendStatus(401);

      PurchaseModel.find({ userId: decrypted._id }, function (err, docs) {
        let count = 0;
        let list = [];

        docs.forEach(item => {
          ArticleModel.findById(item.articleId, function (err, doc) {
            if (err) return;
            list.push(doc);
            count++;
            if (count >= docs.length) {
              return res.send(list);
            }
          });
        });
      });
    } catch(e) {
      console.log(' ::>> error ', e);
    }
  }
);

const log = function(message, articleId, userId) {
  logger.info(message, {
    articleId,
    userId,
    domain: 'purchases'
  });
}

const error = function(message, token, body, error) {
  logger.error(message, {
    token,
    body,
    error: Object.getOwnPropertyDescriptors(new Error(error)).message,
    domain: 'purchases'
  });
}

module.exports = router;
