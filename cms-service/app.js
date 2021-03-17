var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var fileUpload = require('express-fileupload');
var bodyParser = require('body-parser');
const rateLimit = require("express-rate-limit");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var passportRouter = require('./routes/passport');
var articlesRouter = require('./routes/articles');
var audioRouter = require('./routes/audio');
var purchasesRouter = require('./routes/purchases');

var app = express();
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(bodyParser.json({limit:'50MB'}));
app.use(bodyParser.urlencoded({extended:true, limit:'50MB'}));

app.use(fileUpload({
  limits: { fileSize: 50 * 1024 * 1024 },
  safeFileNames: true,
  preserveExtension: true,
  abortOnLimit: true,
  useTempFiles: true,
  tempFileDir: '/tmp/',
  debug: false
}));

app.use(rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
}));

app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/passport', passportRouter);
app.use('/articles', articlesRouter);
app.use('/audio', audioRouter);
app.use('/purchases', purchasesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

// todo: hide all sensitive data in logs
// todo: update logs https://www.loggly.com/ultimate-guide/node-logging-basics/

module.exports = app;
