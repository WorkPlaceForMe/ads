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
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};
const sequelize = require('./campaigns-db/database')
const httpsServer = https.createServer(options, app);
const httpServer = http.createServer(app);
const db1 = require('./campaigns-db/database')
const products = db1.products
const clothing = db1.clothing
const publishers = db1.publishers
const readCsv = require('./controllers/readCsv')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())

require("./helper/cacheManager");

if (conf.get('install') == true) {
  console.log("Installing DB")
  mysql
  .createConnection({
    user: conf.get('user'),
    password: conf.get('password'),
    host: conf.get('host')
  })
  .then(connection => {
    connection.query('CREATE DATABASE IF NOT EXISTS ' + conf.get('database') + ' CHARACTER SET=utf8mb4 COLLATE=utf8mb4_general_ci;').then(() => {
      sequelize.sequelize.sync({force: false}).then(()=>{
        console.log('sequelize is connected')
      }).catch(err =>{
        console.error('no se concecto',err)
      })
    })
  })
}

async function check(){
  const update = await products.findOne({
    order: [['createdAt', 'DESC']]
  })
  const time = 604800 //604800 1 week
  let creation = update.dataValues.createdAt.getTime() / 1000
  let now =  new Date().getTime() / 1000
  while(creation + time >= now){
    now =  new Date().getTime() / 1000
    continue;
  }
  console.log('dropping tables')
  await clothing.destroy({
    where: {},
    truncate: true
  })
  await products.destroy({
    where: {},
    truncate: true
  })
  
  const ids = await publishers.findAll({
    attributes: ['publisherId']
  })
  for(const id of ids){
    await readCsv.readCsv(id.dataValues.publisherId)
    console.log(id.dataValues.publisherId)
  }

  return check()
}

check()

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'pug')
app.use(logger('Date: :date[web] // Url: :remote-addr // Method: :method:url // Status::status // User-agent: :user-agent'))
app.use(logger('Date: :date[web] // Url: :remote-addr // Method: :method:url // Status::status // User-agent: :user-agent',
    {
      stream: fs.createWriteStream('./access.log', { flags: 'a' })
    }
  )
)
app.use('/system',express.static(path.join(__dirname, 'public')))

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

