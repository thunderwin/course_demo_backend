const sqlite3 = require('sqlite3').verbose();

// 连接数据库（如果不存在会自动创建）
const db = new sqlite3.Database('myapp.db');



console.log('数据库连接成功！');