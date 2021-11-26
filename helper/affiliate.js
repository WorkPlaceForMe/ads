const conf = require('../middleware/prop')
const axios = require('axios')
var CryptoJS = require("crypto-js");

exports.getAff = async function(){

    const userAffiliate = conf.get('accesstrade_user')
    const passAffiliate = CryptoJS.MD5(conf.get('accesstrade_pass'))
    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/publishers/auth/${userAffiliate}`

    var userPass = CryptoJS.SHA256(`${userAffiliate}:${passAffiliate}`)

    try{
        const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
                Authorization: userPass
            }
        })
        return(affiliateResponse.data)
    } catch(err) {
        console.error(err)
        return(err)
    }
}