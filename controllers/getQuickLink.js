const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const cred = require('./affiliate')

exports.getQuickLink = Controller(async(req, res) => {
    const siteId = 48475; //TODO: Change this hardcoded site ID to automatically fetching later on
    const campaignId = 660; //TODO: Change this hardcoded campaign ID to automatically fetching later on
    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${siteId}/campaigns/${campaignId}/creatives/quicklink`
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
        console.log(affiliateResponse.data)
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