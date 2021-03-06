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
const https = require('https')
const http = require('http')
const fs = require('fs')
const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem'),
}
const sequelize = require('./campaigns-db/database')
const httpsServer = https.createServer(options, app)
const httpServer = http.createServer(app)
const db1 = require('./campaigns-db/database')
const products = db1.products
const clothing = db1.clothing
const publishers = db1.publishers
const User = db1.users
const readCsv = require('./controllers/readCsv')
const { delay } = require('bluebird')
const bcrypt = require('bcrypt')

let server = conf.get('server').split('/')
server[2] = `www.${server[2]}`
server = server.join('/')

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
// app.use(cors({
//     origin: ['*', server, 'http://localhost:4200']
//   }))
app.use(cors())

require('./helper/cacheManager')

function customHeaders(req, res, next) {
  app.disable('X-Powered-By')
  res.setHeader('X-Powered-By', 'Graymatics-server')
  next()
}

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

async function check(ids = {}) {
  const time = 604800000 //604800 1 week in milliseconds
  const idsCheck = await publishers.findAll({
    attributes: ['publisherId'],
  })
  if (
    Object.keys(ids).length === 0 ||
    Object.keys(ids).length != idsCheck.length
  ) {
    for (const id of idsCheck) {
      const update = await products.findOne({
        where: { Page_ID: id.dataValues.publisherId },
        order: [['createdAt', 'DESC']],
      })
      if (update == null) {
        await readCsv.readCsv(id.dataValues.publisherId)
        ids[id.dataValues.publisherId] = new Date().getTime() / 1000
      } else {
        ids[id.dataValues.publisherId] =
          update.dataValues.createdAt.getTime() / 1000
      }
    }
  }
  let now = new Date().getTime() / 1000
  for (const id in ids) {
    if (ids[id] + time <= now) {
      await clothing.destroy({
        where: { Page_ID: id.dataValues.publisherId },
        truncate: true,
      })
      await products.destroy({
        where: { Page_ID: id.dataValues.publisherId },
        truncate: true,
      })
      await readCsv.readCsv(id)
    }
  }
  await delay(86400000) //1 day 86400000 in milliseonds
  return check(ids)
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
  check()
}

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(
  logger(
    'Date: :date[web] // Url: :remote-addr // Method: :method:url // Status::status // User-agent: :user-agent',
  ),
)
app.use(
  logger(
    'Date: :date[web] // Url: :remote-addr // Method: :method:url // Status::status // User-agent: :user-agent',
    {
      stream: fs.createWriteStream('./access.log', { flags: 'a' }),
    },
  ),
)

app.use('/not-found', express.static('./views/error.html'))

app.use('/system', express.static(path.join(__dirname, 'public')))

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

httpsServer.listen(portS || 3000, function () {
  console.log(`App is running on HTTPS mode using port: ${portS || '3001'}`)
})

httpServer.listen(port || 3000, function () {
	console.log(`App is running on HTTP mode using port: ${port || '3000'}`)
});
