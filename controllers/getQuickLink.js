const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const jwt = require('jsonwebtoken')
const axios = require('axios')
const cred = require('./affiliate')

exports.getQuickLink = Controller(async(req, res) => {
    const siteId = 48475; //TODO: Change this hardcoded site ID to automatically fetching later on
    const campaignId = 660; //TODO: Change this hardcoded campaign ID to automatically fetching later on

    const ids = {
        lazada : 520,
        trueShopping : 594,
        shopee : 677,
        rabbitFinanceA: 720,
        kkpPersonalLoan: 710,
        rabbitFinanceB: 708,
        nanmeeBooks: 692,
        fitbit: 687,
        taradDotCom: 675,
        zwizAI: 638,
        promotionsMoney: 709,
        jorakayOnline: 645,
        agoda: 721,
        newTopsOnline: 704,
        gscAsset: 701,
        monteCarloTailors: 700,
        cignaSmartHealth: 685,
        cignaPA: 684,
        cignaSuperPlan: 683,
        allAboutYou: 666,
        tripDotCom: 535,
        accessTrade: 660
    }

for(const id in ids){
    const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${siteId}/campaigns/${ids[id]}/productfeed/url`
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
        console.log(affiliateResponse.data, id)
        // res.status(200).send({
        //     success: true, data: affiliateResponse.data
        // })
    } catch(err) {
        console.error(err.data)
        // res.status(400).send({
        //     success: false, mess: err
        // })
    }
}).catch((err)=>{console.error(err)})
}
res.status(200).json({success: true})
})