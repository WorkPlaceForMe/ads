const express = require('express')
const controllers = require('../controllers')
const verify = require('../middleware/verifyPubl')

const router = express.Router()

router.get('/api/session', controllers.sessionData)

router.get('/api/v1/ads', controllers.getAds)

router.get('/api/modify/status/:id/:value', controllers.modify)

router.post('/api/data', controllers.postData)

router.get('/api/stats', controllers.getStats)

router.get('/api/stats/url', controllers.getStatsUrl)

router.get('/api/stats/url/img', controllers.getStatsImg)

router.get('/api/report', controllers.generateReport)

router.get('/api/stats/url/img/ad', controllers.getStatsAd)

router.get('/api/log/:id', controllers.auth)

router.get('/test', controllers.getUserDetails)

router.get('/api/iframe', controllers.iframe)

router.get('/api/check', controllers.check)

router.post('/api/adsNum/:id', controllers.updateAds)

router.get('/api/version', controllers.version)

router.post('/api/login', controllers.login)

router.post('/api/register', [verify.checkDuplicatePubl], controllers.register)

router.get('/api/site/:id', controllers.get)

router.put('/api/update', [verify.checkDuplicatePublEdit], controllers.update)

router.delete('/api/del/:id', controllers.del)

router.post('/api/reload/:id', controllers.reloadPublisher)

router.post('/api/pageUpdate', controllers.updatePage)

router.get('/api/sites', controllers.getAll)

router.get('/api/server', controllers.getServer)

module.exports = router
