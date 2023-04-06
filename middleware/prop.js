const PropertiesReader = require('properties-reader')
// const conf_path = process.env.CONF_FILE_PATH
const prop = PropertiesReader('app.properties')
exports.get = function (key) {
	return prop.get(key)
}
