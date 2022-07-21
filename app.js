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
const refreshTimeInterval = conf.get('refresh_time_interval') || 604800000
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

async function check() {
  const currentTime = new Date().getTime()
  const publisherList = await publishers.findAll({
    attributes: ['publisherId', 'name', 'updatedAt']
  })
  
  if (publisherList) {
    for (const publisher of publisherList) {
      const sampleProductClothList = await Promise.all([products.findOne({ where: { Page_ID: publisher.dataValues.publisherId } }), 
        clothing.findOne({ where: { Page_ID: publisher.dataValues.publisherId } })])
      const updatedAtTime = publisher.dataValues.updatedAt.getTime()
      
      if((currentTime - updatedAtTime >= refreshTimeInterval) || (!sampleProductClothList[0] && !sampleProductClothList[1])) {
        const productClothPromises = [];

        productClothPromises.push(clothing.destroy({
          where: { Page_ID: publisher.dataValues.publisherId },
          truncate: true
        }))
        
        productClothPromises.push(products.destroy({
          where: { Page_ID: publisher.dataValues.publisherId },
          truncate: true
        }))
        
        Promise.all(productClothPromises).then(async () => {
          console.log(`All products and cloths deleted for publisher: ${publisher.dataValues.publisherId}`)

          scanAndDeleteRedisData(publisher.dataValues.name, publisher.dataValues.publisherId).then(() => {
            console.log(`All redis cache data delete for Publisher ${publisher.dataValues.publisherId}`)
            
            readCsv.readCsv(publisher.dataValues.publisherId).then(() => {
              
              //Need to update updatedAt time
              publishers.update(
                {
                  publisherId: publisher.dataValues.publisherId
                },
                {
                  where: {
                    publisherId: publisher.dataValues.publisherId
                  }
                }).then(() => {
                  console.log(`Publisher ${publisher.dataValues.publisherId} updated with latest products and cloths`) 
              })                  
            })
          })       
        })       
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
})

scanAndDeleteRedisData = async (pattern, publisherId) => {

  return new Promise(async (resolve, reject) => { 

    try {
      cache.keys('*', (err, keys) => {
        for (const key of keys) {
          if(key.includes(pattern)){
            cache.del(key)
          }
        }

        cache.del(`downloading-${publisherId}`)
        resolve()
      })      
    } catch (err) {
      console.log(err)
      reject(err)
    }
  })
}
