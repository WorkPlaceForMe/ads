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


exports.getAds = Controller(async (req, res) => {
    // Disable SSL certificate
    process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

    // get property values
    const vista_url = conf.get('vista_api_url')
    const user = conf.get('vista_api_user')
    const password = conf.get('vista_api_password')

    const apiEndpoint = '/api/v1/sync'

    // getting query strings
    const { ad_type, img_width, img_height, ad_format, media_type, url, site, uid, serv } = req.query

    let cachedImg = await cache.getAsync(`${img_width}_${img_height}_${url}`);
    if (cachedImg)
        return res.status(200).send({
            results: JSON.parse(cachedImg)
        })

    await addImg(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url, uid, site, async function (err, rows) {
        if (rows) {
            let checker = site.split('/')[2];
            if(checker.includes('www.')){
                checker = checker.split('w.')[1]
            }
            const aut = await auth(checker, site.split('/')[0])
            if (aut['enabled'] == false) {
                console.log("Cancelling")
                return res.status(400).json({ success: false, message: "Unauthorized" })
            } else {
                let formData = new FormData()
                formData.append('upload', request(url))
                // formData.append('subscriptions', 'Object,themes,food,tags,face,fashion')
                formData.append('subscriptions', 'face,fashion,Object')
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
                try {
                    const response = await axios(request_config)

                    console.log('=====================> VISTA RESPONSE <========================')
                    let resultsVista = []
                    if (response.data) {
                        resultsVista.push(response.data.results)
                    }
                    const objetos = await readCsv.readCsv(aut['idP'])
                    const resultsAffiliate = []
                    for (const subscriptions of resultsVista) {
                        if (subscriptions['face'].length != 0) {

                            if (subscriptions['face'][0].deep_face.gender[0]['label'] == 'Female') {
                                for (const obj of subscriptions['fashion']) {
                                    if (obj.class == 'upper') {
                                        let int = Math.floor(Math.random() * objetos[1]['Women Clothes']['shirt'].length)
                                        resultsAffiliate.push({
                                            vista: obj, affiliate: objetos[1]["Women Clothes"]['shirt'][int],
                                            add: { id: parseInt(objetos[1]['Women Clothes']['shirt'][int][0]), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                            serv: serv,
                                            size: {w: img_width, h: img_height}
                                        })
                                        if (resultsAffiliate.length == 2) {
                                            break;
                                        }
                                    }
                                    if (obj.class == 'lower') {
                                        let int = Math.floor(Math.random() * objetos[1]['Women Clothes']['pants'].length)
                                        resultsAffiliate.push({
                                            vista: obj, affiliate: objetos[1]['Women Clothes']['pants'][int],
                                            add: { id: parseInt(objetos[1]['Women Clothes']['pants'][int][0]), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                            serv: serv,
                                            size: {w: img_width, h: img_height}
                                        })
                                        if (resultsAffiliate.length == 2) {
                                            break;
                                        }
                                    }
                                }
                            }
                            if (subscriptions['face'][0].deep_face.gender[0]['label'] == 'Male') {
                                for (const obj of subscriptions['fashion']) {
                                    if (obj.class == 'upper') {
                                        let int = Math.floor(Math.random() * objetos[1]['Men Clothes']['shirt'].length)
                                        resultsAffiliate.push({
                                            vista: obj, affiliate: objetos[1]['Men Clothes']['shirt'][int],
                                            add: { id: parseInt(objetos[1]['Men Clothes']['shirt'][int][0]), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                            serv: serv,
                                            size: {w: img_width, h: img_height}
                                        })
                                        if (resultsAffiliate.length == 2) {
                                            break;
                                        }
                                    }
                                    if (obj.class == 'lower') {
                                        let int = Math.floor(Math.random() * objetos[1]['Men Clothes']['pants'].length)
                                        resultsAffiliate.push({
                                            vista: obj, affiliate: objetos[1]['Men Clothes']['pants'][int],
                                            add: { id: parseInt(objetos[1]['Men Clothes']['pants'][int][0]), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                            serv: serv,
                                            size: {w: img_width, h: img_height}
                                        })
                                        if (resultsAffiliate.length == 2) {
                                            break;
                                        }

                                    }
                                }
                            }
                        }

                        if (resultsAffiliate.length < 2) {
                            for (const obj of subscriptions['Object']) {
                                if (objetos[0][obj.class] != undefined && obj.confidence > 0.6) {
                                    if (objetos[0][obj.class].length != 0) {
                                        let int = Math.floor(Math.random() * objetos[0][obj.class].length)
                                        resultsAffiliate.push({
                                            vista: obj, affiliate: objetos[0][obj.class][int],
                                            add: { id: parseInt(objetos[0][obj.class][int][0]), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                            serv: serv,
                                            size: {w: img_width, h: img_height}
                                        })
                                    }
                                    if (resultsAffiliate.length == 2) {
                                        break;
                                    }

                                }
                            }
                        }
                    }
                    const sendingResults = convert(resultsAffiliate)
                    await cache.setAsync(`${img_width}_${img_height}_${url}`, JSON.stringify(sendingResults));
                    res.status(200).send({
                        results: sendingResults
                    })
                }
                catch (err) {
                    await cache.setAsync(`${img_width}_${img_height}_${url}`, JSON.stringify({}));
                    return res.status(500).json({ success: false, message: "Vista Image failled" })
                }
            }
        }
    })
})

async function addImg(time, imgName, idGeneration, site, callback) {
    return db.query(`INSERT INTO imgsPage values (0,'${time}','${imgName}','${idGeneration}','${site}')`, callback)
}