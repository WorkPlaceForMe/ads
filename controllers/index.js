const { getAds, sessionData } = require('./ads')
const { getUserDetails } = require('./get-user-details')
const { getQuickLink } = require('./getQuickLink')
const { postData } = require('./postData')
const { readCsv } = require('./readCsv')
const { getStats, getStatsUrl, getStatsImg, getStatsAd } = require('./getStats')
const { modify } = require('./modStatus')
const { auth, iframe, check } = require('./auth')
const { updateAds } = require('./updateAds')
const { version } = require('./version')
const { generateReport } = require('./generateReport')
const { login } = require('./user')
const { register, update, get, del, reloadPublisher, getServer, getAll } = require('./sites')

module.exports = {
	sessionData,
	getAds,
	getUserDetails,
	getQuickLink,
	readCsv,
	postData,
	getStats,
	getStatsUrl,
	getStatsImg,
	getStatsAd,
	modify,
	auth,
	iframe,
	check,
	updateAds,
	version,
	register,
	update,
	get,
	del,
	reloadPublisher,
	getServer,
	generateReport,
	login,
	getAll
}
