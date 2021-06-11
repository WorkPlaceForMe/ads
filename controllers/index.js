const { getAds } = require('./ads')
const { getUserDetails } = require('./get-user-details')
const { getSite } = require('./getSites')
const { getCampaign } = require('./getCampaign')
const { getQuickLink } = require('./getQuickLink')
const { postData } = require('./postData')
const { readCsv } = require('./readCsv')
const { getStats, getStatsUrl, getStatsImg, getStatsAd } = require('./getStats')

module.exports = {
	getAds,
	getUserDetails,
	getSite,
	getCampaign,
	getQuickLink,
	readCsv,
	postData,
	getStats,
	getStatsUrl,
	getStatsImg,
	getStatsAd
}
