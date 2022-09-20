const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const handleError = require('./helper/handle-error')
const routers = require('./routes')
const cors = require('cors')
const conf = require('./middleware/prop')
const mysql = require('mysql2/promise')
const app = express()
const port = conf.get('port')
const portS = conf.get('portS')
const refreshTimeInterval = conf.get('refresh_time_interval') || 604800000
const https = require('https')
const http = require('http')
const fs = require('fs')
const options = {
  key: fs.readFileSync(conf.get('ssl_key_file_path')),
  cert: fs.readFileSync(conf.get('ssl_cert_file_path'))
}
const sequelize = require('./campaigns-db/database')
const httpsServer = https.createServer(options, app)
const httpServer = http.createServer(app)
const db = require('./campaigns-db/database')
const products = db.products
const clothing = db.clothing
const publishers = db.publishers
const User = db.users
const { delay } = require('bluebird')
const bcrypt = require('bcrypt')
const axios = require('axios')
const axiosRetry = require('axios-retry')
const { reloadPublisher } = require('./helper/util')

let server = conf.get('server').split('/')
server[2] = `www.${server[2]}`
server = server.join('/')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())

require('./helper/cacheManager')

function customHeaders(req, res, next) {
  app.disable('X-Powered-By')
  res.setHeader('X-Powered-By', 'Graymatics-server')
  next()
}

process.on('uncaughtException', (err) => {
    console.log('Unexpected error occurred')
    console.log(err)
})

app.use(customHeaders)

app.all(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE')
  res.header(
    'Access-Control-Allow-Headers',
    'Origin, X-Requested-With, Content-Type, Accept, x-access-token',
  )
  next()
})

async function check() {
    const publisherList = await publishers.findAll()
  
  if (publisherList) {
    for (const publisher of publisherList) {
      const sampleProductClothList = await Promise.all([products.findOne({ where: { Page_ID: publisher.dataValues.publisherId } }), 
        clothing.findOne({ where: { Page_ID: publisher.dataValues.publisherId } })])
      const updatedAtTime = publisher.dataValues.updatedAt.getTime()
      const currentTime = new Date().getTime()
      
      if((currentTime - updatedAtTime) >= refreshTimeInterval || (!sampleProductClothList[0] && !sampleProductClothList[1])) {
        reloadPublisher(publisher)
      }
    }
  }
  
  //Wait and run the same method after 1 day
  await delay(86400000)
  
  return check()
}

async function createAdminUser() {
  const adminCreated = await User.findOne({ where: { username: 'adminAis' } })
  if (!adminCreated) {
    await User.create({
      username: 'adminAis',
      password: bcrypt.hashSync('AisGraymatics1!', 12),
      email: 'test@graymatics.com',
      role: 'ADMIN',
    })
  }
}

if (conf.get('install') == true) {
  console.log('Installing DB...')
  mysql
    .createConnection({
      user: conf.get('user'),
      password: conf.get('password'),
      host: conf.get('host'),
      port: conf.get('dbport')
    })
    .then((connection) => {
      connection
        .query(
          'CREATE DATABASE IF NOT EXISTS ' +
            conf.get('database') +
            ' CHARACTER SET=utf8mb4 COLLATE=utf8mb4_general_ci;',
        )
        .then(() => {
          sequelize.sequelize
            .sync({ force: false, alter: true })
            .then(() => {
              console.log('Sequelize is connected and updated.')
              createAdminUser()
              check()
            })
            .catch((err) => {
              console.error('Sequelize was not able to connect.', err)
            })
        })
    })
} else {
  console.log('Sequelize is connected.')
  check()
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use('/not-found', express.static('./views/error.html'))

app.use('/system', express.static(path.join(__dirname, 'public')))

app.use('/system/2', express.static(path.join(__dirname, 'public')))

app.use('/management', express.static(conf.get('dashboardAis')))

app.use('/client', express.static(conf.get('dashboardClient')))

app.use('/api/pictures', express.static('./public/pictures'))

// initialize routers
app.use(routers)

// global error handling
app.use(handleError)

// 404 re-route
app.get('*', function (req, res) {
  const path = req._parsedUrl.path.split('/')[1]
  switch (path) {
    case 'management':
      return res.redirect('/management')
    case 'client':
      return res.redirect('/client')
    default:
      return res.redirect('/not-found')
  }
})

httpsServer.listen(portS || 3311, function () {
  console.log(`App is running on HTTPS mode using port: ${portS || '3311'}`)
})

httpServer.listen(port || 3310, function () {
	console.log(`App is running on HTTP mode using port: ${port || '3310'}`)
})

axiosRetry(axios, {
  retries: 2,
  retryDelay: (retryCount) => {
    console.log(`retry attempt: ${retryCount}`)
    return retryCount * 1000
  },
  retryCondition: (error) => {
    return (error && (error.reponse == null || error.response.status !== 200 || 
      error.response.status !== 201 || error.response.status !== 404 || error.response.status !== 500))
  }
})
