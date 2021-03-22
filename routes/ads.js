var express = require('express');
var router = express.Router();


const controller = require('../controllers/ads.controller')

console.log(controller)
/* GET users listing. */
router.get('/', controller.getAds);

module.exports = router;
