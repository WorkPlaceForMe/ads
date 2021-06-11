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
const db = require('../helper/dbconnection')
const dateFormat = require('dateformat');


exports.getAds = Controller(async(req, res) => {
    // Disable SSL certificate
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

    // get property values
    const vista_url = conf.get('vista_api_url')
    const user = conf.get('vista_api_user')
    const password = conf.get('vista_api_password')

    const apiEndpoint = '/api/v1/sync'

    // getting query strings
    const { ad_type, ad_width, ad_height, ad_format, media_type, url, site, uid } = req.query
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
    addImg(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),url,uid,site,function(err,rows){
    })

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
                    // console.log(util.inspect(obj, false, null, true),'+++++', algo)
                    if(algo == 'Object' && obj.class != 'person'){
                        resultsVista.push(obj)
                    }
                    if(algo == 'fashion' && obj.class != 'person'){
                        resultsVista.push(obj)
                    }
                }
            }
        }
    }
    let resultsAffiliate = []
    for(const obj of resultsVista){
        // console.log(util.inspect(obj, false, null, true),'+++++')
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

            let compare, color, item, itemThai;
            if(obj.class != 'person'){
                // console.log(util.inspect(obj, false, null, true),'============')
                compare = obj.class;
                if(obj.class == 'cell_phone'){
                    compare = 'โทรศัพท์'
                }
                if(obj.class == 'tie'){
                    compare = 'ผูก'
                }
                if(obj.class == 'upper'){
                const fashion = {
                    color:obj.deep_fashion_pattern.color[0].label ,
                    pattern: obj.deep_fashion_tf.pattern[0].label,
                    neck_design: obj.deep_fashion_neckline.neckline[0].label,
                    coat_length: obj.deep_fashion_color.coat_length[0].label,
                    sleeve_length: obj.deep_fashion_color.sleeve_length[0].label,
                    neckline_design: obj.deep_fashion_color.neckline_design[0].label,
                    collar_design: obj.deep_fashion_color.collar_design[0].label,
                    // pant_length: obj.deep_fashion_color.pant_length[0].label,
                    // skirt_length: obj.deep_fashion_color.skirt_length[0].label,
                    lapel_design: obj.deep_fashion_color.lapel_design[0].label,
                }
                console.log(fashion)
                if(fashion.neckline_design != 'Invisible'){
                    item = 'shirt'
                    itemThai = 'เสื้อ'
                    if(fashion.lapel_design != 'Invisible'){
                        item = 'jacket'
                        itemThai = 'แจ็คเก็ต'
                    }
                }
                if(fashion.sleeve_length == 'ExtraLongSleeves'){
                    item = 'jacket'
                    itemThai = 'แจ็คเก็ต'
                }
                if(fashion.neck_design == 'hoodie'){
                    item = 'hoodie'
                    itemThai = 'หมวก'
                }                
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
                if(fashion.color == 'grey'){
                    color = 'สีเทา'
                }

                compare = `${itemThai}${color}`
                                console.log(`${item}${fashion.color}`, url)
                }
                if(obj.class == 'lower'){
                const fashion = {
                    color:obj.deep_fashion_pattern.color[0].label ,
                    pattern: obj.deep_fashion_tf.pattern[0].label,
                    // neck_design: obj.deep_fashion_neckline.neckline[0].label,
                    // coat_length: obj.deep_fashion_color.coat_length[0].label,
                    // sleeve_length: obj.deep_fashion_color.sleeve_length[0].label,
                    // neckline_design: obj.deep_fashion_color.neckline_design[0].label,
                    // collar_design: obj.deep_fashion_color.collar_design[0].label,
                    pant_length: obj.deep_fashion_color.pant_length[0].label,
                    skirt_length: obj.deep_fashion_color.skirt_length[0].label,
                    // lapel_design: obj.deep_fashion_color.lapel_design[0].label,
                }
                console.log(fashion)
                if(fashion.pant_length != 'Invisible'){
                    item = 'pants'
                    itemThai = 'กางเกง'
                    // if(fashion.pant_length != 'ShortPant'){
                    //     item = 'shorts'
                    //     itemThai = 'กางเกงขาสั้น'
                    // }
                }
                if(fashion.skirt_length != 'Invisible'){
                    item = 'skirt'
                    itemThai = 'กระโปรง'
                }
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
                if(fashion.color == 'grey'){
                    color = 'สีเทา'
                }

                compare = `${itemThai}${color}`
                                console.log(`${item}${fashion.color}`, url)
                }
                // console.log(util.inspect(obj, false, null, true))
            }else{
                // console.log(util.inspect(obj, false, null, true),'============')
                const fashion = {
                    color:obj.deep_fashion_pattern.color[0].label ,
                    pattern: obj.deep_fashion_tf.pattern[0].label,
                    neck_design: obj.deep_fashion_neckline.neckline[0].label,
                    coat_length: obj.deep_fashion_color.coat_length[0].label,
                    sleeve_length: obj.deep_fashion_color.sleeve_length[0].label,
                    neckline_design: obj.deep_fashion_color.neckline_design[0].label,
                    collar_design: obj.deep_fashion_color.collar_design[0].label,
                    pant_length: obj.deep_fashion_color.pant_length[0].label,
                    skirt_length: obj.deep_fashion_color.skirt_length[0].label,
                    lapel_design: obj.deep_fashion_color.lapel_design[0].label,
                }
                if(fashion.pant_length != 'Invisible'){
                    item = 'pants'
                    itemThai = 'กางเกง'
                    if(fashion.pant_length != 'ShortPant'){
                        item = 'shorts'
                        itemThai = 'กางเกงขาสั้น'
                    }
                }
                if(fashion.neckline_design != 'Invisible'){
                    item = 'shirt'
                    itemThai = 'เสื้อ'
                    if(fashion.lapel_design != 'Invisible'){
                    item = 'jacket'
                    itemThai = 'แจ็คเก็ต'
                }
                }
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
                if(fashion.color == 'grey'){
                    color = 'สีเทา'
                }

                compare = `${itemThai}${color}`
                console.log(`${item}${fashion.color}`, url)
            }

            for(const resCsv of results){
                if(resCsv['Description'].includes(compare)){
                    console.log(resCsv['Merchant Product Name'])
                    resultsAffiliate.push({vista: obj, affiliate: resCsv})
                    // console.log(resCsv['Merchant Product ID'],site, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),url,uid)
                        addAd(parseInt(Object.values(resCsv)[0]),site, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),url,uid,function(err,rows){
                        })
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

function addAd(name,site,time,imgName,idGeneration,callback){
    return db.query(`INSERT INTO adsPage values (0,'${name}','${site}','${time}','${imgName}','${idGeneration}')`,callback)
}

function addImg(time,imgName,idGeneration,site,callback){
    return db.query(`INSERT INTO imgsPage values (0,'${time}','${imgName}','${idGeneration}','${site}')`,callback)
}