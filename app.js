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
          // connection.query(
          //   'USE ' + conf.get('database') + '; DROP TABLE IF EXISTS `' + conf.get('database') + '.adsPage`; CREATE TABLE `' + conf.get('database') + '.adsPage` (`id` int(11) NOT NULL AUTO_INCREMENT,`idItem` varchar(200) DEFAULT NULL,`site` varchar(200) DEFAULT NULL,`time` datetime DEFAULT NULL,`imgName` varchar(200) DEFAULT NULL,`idGeneration` bigint(11) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=646 DEFAULT CHARSET=latin1; DROP TABLE IF EXISTS `' + conf.get('database') + '.imgsPage`; CREATE TABLE `' + conf.get('database') + '.imgsPage` (`id` int(11) NOT NULL AUTO_INCREMENT, `time` datetime DEFAULT NULL, `img` varchar(200) DEFAULT NULL, `idGeneration` bigint(11) DEFAULT NULL, `site` varchar(200) DEFAULT NULL, PRIMARY KEY (`id`)) ENGINE=InnoDB AUTO_INCREMENT=794 DEFAULT CHARSET=latin1; DROP TABLE IF EXISTS `' + conf.get('database') + '.impressions`; CREATE TABLE `' + conf.get('database') + '.impressions` (`idimpressions` int(11) NOT NULL AUTO_INCREMENT, `type` int(11) DEFAULT NULL, `time` datetime DEFAULT NULL, `url` varchar(200) DEFAULT NULL, `idItem` bigint(11) DEFAULT NULL, `img` varchar(200) DEFAULT NULL, PRIMARY KEY (`idimpressions`)) ENGINE=InnoDB AUTO_INCREMENT=190 DEFAULT CHARSET=latin1;'
          // )
      })
    })

}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(logger('dev'))
app.use('/system',express.static(path.join(__dirname, 'public')))

// client side
app.use('/management',express.static(conf.get('dashboardAis')));

app.use('/client',express.static(conf.get('dashboardClient')));

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

