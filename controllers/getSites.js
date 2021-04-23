const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const cred = require('./affiliate')

exports.getSite = Controller(async(req, res) => {
    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites`
    cred.getAff.then(async function(credentials){
    const token = jwt.sign(
        { sub: credentials.userUid},
        credentials.secretKey,
        {
          algorithm: "HS256"
        }
      )

    try{
        const affiliateResponse = await axios.get(affiliateEndpoint, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'X-Accesstrade-User-Type': 'publisher'
            }
        })
        res.status(200).send({
            success: true, data: affiliateResponse.data
        })
    } catch(err) {
        res.status(400).send({
            success: false, mess: err
        })
    }
}).catch((err)=>{console.error(err)})
})