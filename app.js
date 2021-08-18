const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const handleError = require('./helper/handle-error')
const routers = require('./routes')
const cors = require('cors')
const conf = require('./middleware/prop')
const mysql = require('mysql2/promise')
const app = express()
const port = conf.get('port')
const portS = conf.get('portS')
const https = require('https');
const http = require('http');
const fs = require('fs');
const shell = require("shelljs");
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

const httpsServer = https.createServer(options, app);
const httpServer = http.createServer(app);

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())

if (conf.get('install') == true) {
  mysql
    .createConnection({
      user: conf.get('user'),
      password: conf.get('password'),
      host: conf.get('host')
    })
    .then(connection => {
      connection.query('CREATE DATABASE IF NOT EXISTS ' + conf.get('database') + ';').then(() => {
          shell.exec(`mysql --password=${conf.get('password')} --user=${conf.get('user')} ${conf.get('database')} < strc.sql`, function(err,data){
              if(err) console.error(err)
              if(data) console.log(data)
          })
      })
    })
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(logger('dev'))
app.use('/system',express.static(path.join(__dirname, 'public')))

// client side
app.use('/management',express.static(conf.get('dashboardAis')));

app.use('/client',express.static(conf.get('dashboardClient')));

// app.get('/client', (req, res) => {
//     res.sendFile('index.html',{root:path.join(__dirname, 'distAis')})
// });

app.use('/api/pictures', express.static('./public/pictures'))

// initialize routers
app.use(routers)

// global error handling
app.use(handleError)

httpsServer.listen(portS || 3000, function () {
	console.log(`App is up on port ${portS || '3000'} on HTTPS`)
});

httpServer.listen(port || 3000, function () {
	console.log(`App is up on port ${port || '3000'} on HTTP`)
});

