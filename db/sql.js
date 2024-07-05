const mysql = require('mysql')
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'jcjxcfl8',
    database: 'photo_warehouse_db'
})

module.exports = connection