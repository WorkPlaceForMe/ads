const express = require('express')
const controllers = require('../controllers')
const verify = require('../middleware/verifyPubl')

const router = express.Router()

/* GET home page. */
// router.get('/', function (req, res) {
// 	res.render('index', { title: 'Express' })
// })

router.get('/api/v1/ads', controllers.getAds)

router.get('/api/modify/status/:id/:value', controllers.modify)

router.post('/api/data', controllers.postData)

router.get('/api/stats', controllers.getStats)

router.get('/api/stats/url', controllers.getStatsUrl)

router.get('/api/stats/url/img', controllers.getStatsImg)

router.get('/api/stats/url/img/ad', controllers.getStatsAd)

router.get('/api/log/:id', controllers.auth)

// router.get('/api/aff', controllers.getQuickLink)

router.get('/test', controllers.getUserDetails)

router.get('/api/check', controllers.check)

router.post('/api/adsNum/:id', controllers.updateAds)

router.get('/api/version', controllers.version)

router.post('/api/register', [verify.checkDuplicatePubl], controllers.register)

router.get('/api/site/:id', controllers.get)

router.put('/api/update', [verify.checkDuplicatePublEdit], controllers.update)

router.delete('/api/del/:id', controllers.del)

router.get('/api/server', controllers.getServer)

module.exports = router
