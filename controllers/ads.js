const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const StatusError = require('../helper/StatusError')
const axios = require('axios')
const FormData = require('form-data')
const request = require('request')
const jwt = require('jsonwebtoken')
const util = require('util')
const init = require('./affiliate')
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
            // console.log(response.data.results)
            // console.log(util.inspect(response.data.results, false, null, true))
            if(response.data.results[algo] != {}){
                for(const obj of response.data.results[algo]){
                    if(algo == 'Object' && obj.class != 'person'){
                        resultsVista.push(obj)
                    }
                    if(algo == 'fashion'){
                        resultsVista.push(obj)
                    }
                }
            }
        }
    }
    let resultsAffiliate = []
    for(const obj of resultsVista){
        // await init.getAff.then(async function(creds){

        // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/reports/conversion`
        // const siteId = 48475
        // const campaignId = 520
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
        // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${siteId}/campaigns/${ids.shopee}/productfeed/url`
        // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${siteId}/campaigns/affiliated`
        
        //This endpoint is for testing, needs to be replaces with the one to request the similar items
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
            // console.log(obj.class)
        await readCsv.readCsv.then(async function(results){

            let compare;
            if(obj.class != 'person'){
                compare = obj.class;
                console.log(util.inspect(obj, false, null, true))
            }else{
                console.log(util.inspect(obj, false, null, true))
                let item
                const fashion = {
                    color: obj.deep_fashion_color.color[0].label,
                    pattern: obj.deep_fashion_pattern.pattern[0].label,
                    neck_design: obj.deep_fashion_tf.neck_design[0].label,
                    coat_length: obj.deep_fashion_tf.coat_length[0].label,
                    sleeve_length: obj.deep_fashion_tf.sleeve_length[0].label,
                    neckline_design: obj.deep_fashion_tf.neckline_design[0].label,
                    collar_design: obj.deep_fashion_tf.collar_design[0].label,
                    pant_length: obj.deep_fashion_tf.pant_length[0].label,
                    skirt_length: obj.deep_fashion_tf.skirt_length[0].label,
                    lapel_design: obj.deep_fashion_tf.lapel_design[0].label,
                }
                if(fashion.pant_length != 'Invisible'){
                    item = 'pants'
                    item = 'กางเกง'
                    if(fashion.pant_length != 'ShortPant'){
                        item = 'shorts'
                        item = 'กางเกงขาสั้น'
                    }
                }
                if(fashion.neckline_design != 'Invisible'){
                    item = 'shirt'
                    item = 'เสื้อ'
                    if(fashion.lapel_design != 'Invisible'){
                    item = 'jacket'
                    item = 'แจ็คเก็ต'
                }
                }
                let color;
                if(fashion.color == 'black'){
                    color = 'ดำ'
                }
                if(fashion.color == 'blue'){
                    color = 'สีน้ำเงิน'
                }
                if(fashion.color == 'red'){
                    color = 'สีแดง'
                }
                if(fashion.color == 'yellow'){
                    color = 'สีเหลือง'
                }
                if(fashion.color == 'brown'){
                    color = 'น้ำตาล'
                }
                if(fashion.color == 'purple'){
                    color = 'สีม่วง'
                }
                if(fashion.color == 'green'){
                    color = 'สีเขียว'
                }
                if(fashion.color == 'white'){
                    color = 'ขาว'
                }

                compare = `${item}${color}`
            }
            console.log(compare)
            for(const resCsv of results){
                if(resCsv['Description'].includes(compare)){
                    // console.log(resCsv['Merchant Product Name'])
                    resultsAffiliate.push({vista: obj, affiliate: resCsv})
                    break;
                }
            }
        })
        // }).catch((err)=>{console.error(err)})
    }

    sendingResults = convert(resultsAffiliate)

    res.status(200).send({
        results: sendingResults
    })
})