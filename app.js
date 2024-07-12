var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
let morgan = require('morgan')
var logger = require('./logger');

// 路由文件引用
var indexRouter = require('./routes/index');
var userRouter = require('./routes/user');

// JSON WEB TOKEN
const expressJwt = require('express-jwt');
// CORS
const cors = require("cors");

var app = express();

// 把默认的Authorization换成refresh-token
const getToken = (req) => {
  if (req.headers['refresh-token']) {
    return req.headers['refresh-token'];
  } else if (req.query && req.query['refresh-token']) {
    return req.query['refresh-token'];
  }
  return null;
}

// 使用中间件验证token合法性，除了这些地址，其他的URL都需要验证
app.use(expressJwt({
  secret: 'secret',
  algorithms: ['HS256'],
  getToken: getToken
}).unless({
  path: ['/', /\/images\/*/, '/user/token']
}));

// 设置跨域资源分享CORS
app.use(cors({ credentials: true, origin: /^((https|http|ftp|rtsp|mms)?:\/\/)[^\s]+/ }));

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// app.use(logger('dev'));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/user', userRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// 处理401报错
app.use(function (err, req, res, next) {
  // 如果解析失败，会抛出 UnauthorizedError
  if (err.name === 'UnauthorizedError') {
    res.status(401).json({
      status: false,
      ...err
    })
  } else {
    next(err)
  }
})

// 处理非404的错误（throw 出来的错误)
const _errorHandler = (err, req, res, next) => {
  logger.error(`${req.method} ${req.originalUrl} ` + err.message)
  const errorMsg = err.message
  res.status(err.status || 500).json({
    code: -1,
    success: false,
    message: errorMsg,
    data: {}
  })
}
app.use(_errorHandler)
module.exports = app;
