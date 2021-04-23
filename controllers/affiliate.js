const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const StatusError = require('../helper/StatusError')
const axios = require('axios')
var CryptoJS = require("crypto-js");

exports.getAff = Controller(async(req, res) => {

    const userAffiliate = conf.get('accesstrade_user')
    const passAffiliate = CryptoJS.MD5(conf.get('accesstrade_pass'))
    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/publishers/auth/${userAffiliate}`

    var userPass = CryptoJS.SHA256(`${userAffiliate}:${passAffiliate}`)
    // console.log(userPass)

    try{
        const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
                Authorization: userPass
            }
        })
        console.log(affiliateResponse)
    } catch(err) {
        console.error(err)
    }

    res.status(200).send({"affiliateResponse": "some"})
})