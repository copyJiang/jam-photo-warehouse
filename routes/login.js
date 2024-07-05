var express = require('express');
var router = express.Router();
const connection = require('../db/sql');
var md5 = require('md5-node');

/* GET users listing. */
router.post('/', function (req, res, next) {
    if (!req.query.username || !req.query.password) {
        res.json({
            code: 400,
            msg: "参数列表错误（缺少，格式不匹配）",
            data: null,
            status: false
        });
    }
    const data = {
        username: req.query.username,
        password: md5(req.query.password)
    }

    const sqlStr = "select * from warehouse_user where username=? and password=?";
    connection.query(sqlStr, [req.query.username, md5(req.query.password)], function (error, results, fields) {
        res.json(results)
    })
});

module.exports = router;
