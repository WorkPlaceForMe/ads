const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const handleError = require('./helper/handle-error')
const routers = require('./routes')
const cors = require('cors')
const conf = require('./middleware/prop')

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

const httpsServer = https.createServer(options, app);
const httpServer = http.createServer(app);

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())


// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')))

// client side
app.use('/dashboard',express.static(conf.get('dashboard')));

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

