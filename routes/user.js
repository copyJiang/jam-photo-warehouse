var express = require('express');
var router = express.Router();
const connection = require('../db/sql');
let axios = require('axios');
// JSON Web Token
const jwt = require("jsonwebtoken");
// 微信小程序
let { appid, appSecret } = require("../config/wx");

/**
 * 获取token
 * data { 
 * code // 微信小程序code
 * }
 */
router.post('/token', async function (req, res, next) {
  let { code } = req.body;
  let url = 'https://api.weixin.qq.com/sns/jscode2session';

  const { status, statusText, data: { openid, session_key, errcode, errmsg } } = await axios.get(url, {
    params: {
      appid,
      secret: appSecret,
      js_code: code,
      grant_type: 'authorization_code'
    }
  })
  // 获取 openid, session_key 失败
  if (status !== 200) {
    res.json({
      status: false,
      msg: statusText
    });
    return;
  }
  // 微信api返回错误
  if (errcode) {
    res.json({
      status: false,
      msg: errmsg
    });
    return;
  }
  // 根据openid, session_key生成token
  let token = jwt.sign({ openid, session_key }, 'secret');
  // 查询数据库中是否有此openid
  let select_sql = 'SELECT * FROM user WHERE openid = ?';
  connection.query(select_sql, [openid], (error, results, fields) => {
    if (!results.length) {
      // 数据库中无此openid, 插入数据
      let insert_sql = 'INSERT INTO user (openid ,session_key) VALUES (?,?)';
      connection.query(insert_sql, [openid, session_key], (error, results, fields) => {
        if (error) {
          res.json({
            status: false,
            msg: error
          });
          return;
        }
        // 返回token
        res.json({
          status: true,
          data: token
        })
      })
      return;
    }
    // 数据库中有此openid, 更新数据
    let update_sql = 'UPDATE user SET session_key = ? WHERE openid = ?';
    connection.query(update_sql, [session_key, openid], (error, results, fields) => {
      if (!error) {
        res.json({
          status: true,
          data: token
        })
      }
    })
  });
});

/**
 * 修改用户信息
 */
router.put('/info', async function (req, res, next) {
  const { nickName, sex, avatar, tel, country, province, city } = req.body
  const { openid } = req.user
  let sql = 'UPDATE user SET nickName = ?, sex = ?, avatar = ?, tel = ?, country = ?, province = ?, city = ? WHERE openid = ?';

  connection.query(sql, [nickName, sex, avatar, tel, country, province, city, openid], (error, results, fields) => {
    if (!error) {
      res.json({
        status: true,
        msg: '保存成功！'
      })
    }
  })
})


/**
 * 获取用户信息
 */
router.get('/info', async function (req, res, next) {
  const { openid } = req.user;
  let sql = 'SELECT * FROM user WHERE openid = ?';
  connection.query(sql, [openid], (error, results, fields) => {
    if (!results.length) {
      res.json({
        status: false,
        msg: '用户不存在'
      })
      return;
    }
    res.json({
      status: true,
      data: results[0]
    })
  })
})

module.exports = router;
