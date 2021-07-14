const axios = require('axios')
const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const StatusError = require('../helper/StatusError')
const create = require('../helper/createWebsite')

exports.getUserDetails = Controller(async (req, res) => {
	create.create('aaaaaaaaa-dddddddddd-cc','omm-ais.com','https:').then((id)=>{
		console.log(id)
		res.status(200).json({id: id})
	})
	// console.log(id)
	// res.status(200).json({id: id})
})
