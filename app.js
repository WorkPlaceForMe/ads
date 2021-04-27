const express = require('express')
const path = require('path')
const cookieParser = require('cookie-parser')
const logger = require('morgan')
const handleError = require('./helper/handle-error')
const routers = require('./routes')
const cors = require('cors')

const app = express()
const port = 3310

app.use(express.json())
app.use(express.urlencoded({ extended: false }))
app.use(cookieParser())
app.use(cors())

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')
app.use(logger('dev'))
app.use(express.static(path.join(__dirname, 'public')))

app.use('/api/pictures', express.static('./public/pictures'))

// initialize routers
app.use(routers)

// global error handling
app.use(handleError)


app.listen(port || 3000, function () {
	console.log(`App is up on port ${port || '3000'}`)
})
