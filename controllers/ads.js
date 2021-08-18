const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const axios = require('axios')
const FormData = require('form-data')
const request = require('request')
const readCsv = require('./readCsv')
const convert = require('../helper/convertObject').convert
const db = require('../helper/dbconnection')
const dateFormat = require('dateformat');
const auth = require('../helper/auth')
const util = require('util')

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

    await addImg(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),url,uid,site, async function(err,rows){
        if(rows){
            const aut = await auth(site.split('/')[2],site.split('/')[0])
            if(aut['enabled'] == false){
                console.log("Cancelling")
                return res.status(400).json({success: false, message: "Unauthorized"})
            }else{
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

                const response = await axios(request_config)
                // .catch((err)=>{console.error(err)})

                console.log('=====================> VISTA RESPONSE <========================')
                //     console.log(response.data.results)
                console.log(util.inspect(response.data, false, null, true))
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
                    const results = await readCsv.readCsv(aut['idP'])

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
                                color:obj.deep_fashion_pattern.color[0].label,
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
                            // console.log(fashion)
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
                        }
                        for(const resCsv of results){
                            if(resCsv['Description'] != ''){
                                if(resCsv['Description'].includes(compare)){
                                    // console.log(resCsv['Merchant Product Name'],resCsv)
                                    resultsAffiliate.push({vista: obj, affiliate: resCsv})
                                        addAd(parseInt(Object.values(resCsv)[0]),site, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),url,uid,function(err,rows){
                                        })
                                    break;
                                }
                            }else{
                                if(resCsv['Merchant Product Name'].includes(compare)){
                                    resultsAffiliate.push({vista: obj, affiliate: resCsv})
                                        addAd(parseInt(Object.values(resCsv)[0]),site, dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"),url,uid,function(err,rows){
                                        })
                                    break;
                                }
                            }
                        }
                }

                const sendingResults = convert(resultsAffiliate)

                res.status(200).send({
                    results: sendingResults
                })
            }
        }
    })
})

function addAd(name,site,time,imgName,idGeneration,callback){
    return db.query(`INSERT INTO adsPage values (0,'${name}','${site}','${time}','${imgName}','${idGeneration}')`,callback)
}

async function addImg(time,imgName,idGeneration,site,callback){
    return db.query(`INSERT INTO imgsPage values (0,'${time}','${imgName}','${idGeneration}','${site}')`,callback)
}