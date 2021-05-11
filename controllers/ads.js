const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const StatusError = require('../helper/StatusError')
const axios = require('axios')
const FormData = require('form-data')
const request = require('request')
const jwt = require('jsonwebtoken')
const util = require('util')
const init = require('./affiliate')
const mergeCsv = require('./mergeCsv')
const readCsv = require('./readCsv')
const convert = require('../helper/convertObject').convert

exports.getAds = Controller(async(req, res) => {
    // Disable SSL certificate
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

    // get property values
    const vista_url = conf.get('vista_api_url')
    const user = conf.get('vista_api_user')
    const password = conf.get('vista_api_password')

    const apiEndpoint = '/api/v1/sync'

    // getting query strings
    const { ad_type, ad_width, ad_height, ad_format, media_type, url } = req.query
    let formData = new FormData()
    formData.append('upload', request(url))
    // formData.append('subscriptions', 'Object,themes,food,tags,face,fashion')
    formData.append('subscriptions', 'Object,fashion')

    const request_config = {
        method: 'post',
        url: vista_url + apiEndpoint,
        headers: {
            'Content-Type': `multipart/form-data; boundary=${formData._boundary}`
        },
        auth: {
            username: user,
            password: password
        },
        data: formData
    }
    console.log("Sending request")

    const response = await axios(request_config).catch((err)=>{console.error(err)})

    console.log('=====================> VISTA RESPONSE <========================')
    //     console.log(response.data.results)
    // console.log(util.inspect(response.data, false, null, true))
    let resultsVista = []
    if(response.data){
        for(const algo in response.data.results){
            if(response.data.results[algo] != {}){
                for(const obj of response.data.results[algo]){
                    if(obj.class != 'person'){
                        resultsVista.push(obj)
                    }
                }
            }
        }
    }
    let resultsAffiliate = [];

   

    for(const obj of resultsVista){
        await init.getAff.then(async function(creds){
        
        // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/reports/conversion`
       
        // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${siteId}/campaigns/affiliated`
        // This endpoint is for testing, needs to be replaces with the one to request the similar items
        // const campaignId = 520
        // const siteId = 48475
        // const ids = {
        //     lazada : 520,
        //     trueShopping : 594,
        //     shopee : 677,
        //     rabbitFinanceA: 720,
        //     kkpPersonalLoan: 710,
        //     rabbitFinanceB: 708,
        //     nanmeeBooks: 692,
        //     fitbit: 687,
        //     taradDotCom: 675,
        //     zwizAI: 638,
        //     promotionsMoney: 709,
        //     jorakayOnline: 645,
        //     agoda: 721,
        //     newTopsOnline: 704,
        //     gscAsset: 701,
        //     monteCarloTailors: 700,
        //     cignaSmartHealth: 685,
        //     cignaPA: 684,
        //     cignaSuperPlan: 683,
        //     allAboutYou: 666,
        //     tripDotCom: 535,
        //     accessTrade: 660
        // }
        // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${siteId}/campaigns/${ids.lazada}/productfeed/url`
        // const token = jwt.sign(
        //     { sub: creds.userUid},
        //     creds.secretKey,
        //     {
        //     algorithm: "HS256"
        //     }
        // )

        // try{
        //     const affiliateResponse = await axios.get(affiliateEndpoint, {
        //         headers: {
        //             'Authorization': `Bearer ${token}`,
        //             'X-Accesstrade-User-Type': 'publisher'
        //         }
        //     })
        //     // Success response for requesting the affiliate API
        //     console.log(affiliateResponse.data)
        //     resultsAffiliate.push(obj)

        // } catch(err) {
        //     // Error handler after the request to the API
        //     resultsAffiliate.push(obj)
        //     console.error(err.response.data)
        // }
        await mergeCsv.mergeCsv(creds);
        await readCsv.readCsv.then(async function(results){
            for(const resCsv of results){
                if(resCsv['Category Name'] == obj.class){
                    resultsAffiliate.push(resCsv)
                    break;
                }
            }
            // console.log(results[0], obj)
        })
        // console.log('Ready to be used')
        }).catch((err)=>{
            console.log("=========!!!!!!!!!!!================")
            console.error(err)})
    }
    
    console.log(resultsAffiliate)
    
    sendingResults = convert(resultsAffiliate)

    //This response needs to be changed inside of the request for the affiliate API.
    res.status(200).send({
        results: sendingResults
    })
})