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
const cache = require('../helper/cacheManager')
// const objetos = require('/home/rodrigo/Documents/ads-Thai-Affiliate/csv/59183.json');


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

    let cachedImg = await cache.getAsync(url);
    // if(cachedImg)
    //     return res.status(200).send({
    //                 results: JSON.parse(cachedImg)
    //             })

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
                formData.append('subscriptions', 'Object,fashion,face')
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
                try{
                    const response = await axios(request_config)

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
                                    if(resultsVista.length == 2){
                                        break;
                                    }
                                }
                                if(algo == 'fashion' && obj.class != 'person'){
                                    resultsVista.push(obj)
                                    if(resultsVista.length == 2){
                                        break;
                                    }
                                }
                            }
                        }
                    }
                }
                const objetos = await readCsv.readCsv(aut['idP'])
                const resultsAffiliate = []
                for(const obj of resultsVista){
                    console.log(obj.class)
                        if(objetos[0][obj.class] != undefined){
                        let int = Math.floor(Math.random() * 100)
                        console.log("entreeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
                    resultsAffiliate.push({vista: obj, affiliate: objetos[0][obj.class][int],
                         add: {id: parseInt(objetos[0][obj.class][0][0]), site: site, date:  dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url:url, uid: uid}})
                    }
                   else if(obj.class == 'upper'){
                        // console.log("entruuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuuu")
                        let int = Math.floor(Math.random() * 100)
                        resultsAffiliate.push({vista: obj, affiliate: objetos[1]['shirt'][int],
                            add: {id: parseInt(objetos[1]['shirt'][0][0]), site: site, date:  dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url:url, uid: uid}})   
                    }
                    if(obj.class == 'lower'){
                        console.log("entraaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                        let int = Math.floor(Math.random() * 100)
                        resultsAffiliate.push({vista: obj, affiliate: objetos[1]['pants'][int],
                            add: {id: parseInt(objetos[1]['pants'][0][0]), site: site, date:  dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url:url, uid: uid}})  
                    }

                }

                const sendingResults = convert(resultsAffiliate)
                // await cache.setAsync(url, JSON.stringify(sendingResults));
                console.log(sendingResults,'######################################################################')
                res.status(200).send({
                    results: sendingResults
                })
                }catch(err){
                    // console.log(err)
                    // console.log(util.inspect(err, false, null, true))
                    return res.status(500).json({success: false, message: "Vista Image failled"}) 
                }
            }
        }
    })
})

async function addImg(time,imgName,idGeneration,site,callback){
    return db.query(`INSERT INTO imgsPage values (0,'${time}','${imgName}','${idGeneration}','${site}')`,callback)
}