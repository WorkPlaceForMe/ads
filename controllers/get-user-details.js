const axios = require('axios')
const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const StatusError = require('../helper/StatusError')

exports.getUserDetails = Controller(async (req, res) => {
	process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
	const vista_url = conf.get('vista_api_url')
	const user = conf.get('vista_api_user')
	const password = conf.get('vista_api_password')
	const apiEndpoint = '/api/v1/user'

	const request_config = {
		method: 'get',
		url: vista_url + apiEndpoint,
		auth: {
			username: user,
			password: password
		}
	}
	const response = await axios(request_config)
	res.status(200).send(response.data)
})
