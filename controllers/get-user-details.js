const axios = require('axios')
const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const StatusError = require('../helper/StatusError')
const website = require('../helper/website')

exports.getUserDetails = Controller(async (req, res) => {
	website.create('aaaaaaaaa-dddddddddd-cc','omm-ais.com','https:').then((id)=>{
		console.log(id)
		res.status(200).json({id: id})
	})
})