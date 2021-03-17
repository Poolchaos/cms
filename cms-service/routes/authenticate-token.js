const jwt = require('jsonwebtoken');
require('dotenv').config();

const AnonymousModel = require('../models/anonymous-model');
const UserModel = require('../models/user-model');

const authenticateUser = function(res, next, user, rolePermissions) {
  try {
    UserModel.find({ email: user.email }).then(function (docs) {
      const user = docs[0];
      if (user) {
        const decryptedUser = jwt.verify(user.token, process.env.COMPLETE_KEY);
        if (decryptedUser && decryptedUser.role === user.role) {
          if (rolePermissions && rolePermissions.length > 0) {
            if (rolePermissions.includes(user.role)) {
              return next();
            } else {
              return res.sendStatus(401, { error: 'Unauthorized User' });
            }
          } else {
            return next();
          }
        }
      }
      return res.sendStatus(401, { error: 'Unauthorized User' });
    })
    .catch(e => {
      console.log(' ::>> failed to get data ', e);
      return res.sendStatus(500, { error: e });
    });
  } catch(e) {
    return res.sendStatus(500, { error: e });
  }
};

const authenticateToken = function(req, res, next, rolePermissions) {
  try {
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) return res.sendStatus(401);

    const decrypted = jwt.verify(token, process.env.COMPLETE_KEY);

    if (decrypted) {
      return authenticateUser(res, next, decrypted, rolePermissions);
    }
  } catch(e) {
    return res.sendStatus(500, { error: e });
  }
}

const authenticateAnonymous = function (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);

  AnonymousModel.find({}, function (err, docs) {
    if (err) return res.sendStatus(500, {error: err});
    if (docs[0]) {
      if (token.indexOf(docs[0].anonymous) >= 0) {
        return next();
      }
    }
    return res.sendStatus(401)
  });
};

const tokenValidate = function (req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) return res.sendStatus(401);
  next();
}

module.exports = {
  authenticateToken,
  authenticateAnonymous,
  tokenValidate
};