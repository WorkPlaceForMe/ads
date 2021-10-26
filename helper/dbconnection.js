var mysql=require('mysql');
const conf = require('../middleware/prop')

 var connection=mysql.createPool({
   host     : conf.get('host'),
   user     : conf.get('user'),
   password : conf.get('password'),
   database : conf.get('database')
});
 module.exports=connection;
