const express = require('express')
const controllers = require('../controllers')

const router = express.Router()

/* GET home page. */
// router.get('/', function (req, res) {
// 	res.render('index', { title: 'Express' })
// })

router.get('/users', controllers.getUserDetails)

router.get('/api/v1/ads', controllers.getAds)

router.get('/token', controllers.getSite)

router.get('/campaigns', controllers.getCampaign)

router.get('/links', controllers.getQuickLink)


module.exports = router
