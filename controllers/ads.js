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
const db1 = require('../campaigns-db/database')
const { resolve } = require('path')
const products = db1.products
const clothing = db1.clothing
const imgsPage = db1.imgsPage


exports.getAds = Controller(async (req, res) => {
    // Disable SSL certificate
    // process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

    // get property values
    const vista_url = conf.get('vista_api_url')
    const user = conf.get('vista_api_user')
    const password = conf.get('vista_api_password')

    const apiEndpoint = '/api/v1/sync'

    // getting query strings

    const { ad_type, img_width, img_height, ad_format, media_type, url, site, uid, serv, mobile } = req.query
    let cachedImg = await cache.getAsync(`${mobile}_${img_width}_${img_height}_${url}`);

    if (cachedImg)
        return res.status(200).send({
            results: JSON.parse(cachedImg)
        })

    await addImg(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url, uid, site).then(async () => {
        let checker = site.split('/')[2];
        if (checker.includes('www.')) {
            checker = checker.split('w.')[1]
        }
        const aut = await auth(checker, site.split('/')[0])
        if (aut['enabled'] == false) {
            console.log("Cancelling")
            return res.status(400).json({ success: false, message: "Unauthorized" })
        } else {
            let formData = new FormData()
            formData.append('upload', request(url))

            formData.append('subscriptions', 'face,fashion,Object,tags2,themes')

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
                // if(response.data.results.sport != []){
                //     console.log(util.inspect(response.data.results.sport, false, null, true),url)
                // }

                console.log('=====================> VISTA RESPONSE <========================')
                let resultsVista = []
                if (response.data) {
                    resultsVista.push(response.data.results)
                }
                const objetos = await readCsv.readCsv(aut['idP'])
                const resultsAffiliate = await filler(resultsVista, serv, img_width, img_height, site, url, uid, objetos, mobile)
                const sendingResults = await convert(resultsAffiliate)

                await cache.setAsync(`${mobile}_${img_width}_${img_height}_${url}`, JSON.stringify(sendingResults));
                res.status(200).send({
                    results: sendingResults
                })
            }
            catch (err) {
                if (err.response)
                    console.log(err.response.status, url)
                console.log(err)
                await cache.setAsync(`${mobile}_${img_width}_${img_height}_${url}`, JSON.stringify({}));
                return res.status(500).json({ success: false, message: "Vista Image failled", error: err, img: url })
            }
        }
    })
})

async function addImg(time, imgName, idGeneration, site) {
    return imgsPage.create({
        time: time,
        img: imgName,
        idGeneration: idGeneration,
        site: site,
    })
}
async function filler(resultsVista, serv, img_width, img_height, site, url, uid, objetos, mobile) {
    return new Promise(async (resolve) => {
        const resultsAffiliate = []
        for (const subscriptions of resultsVista) {
            let bool = false;
            for (const some of subscriptions['tags2'].tags2.tags2) {
                if (some['IAB'].includes('IAB17')) {
                    bool = true
                    if (resultsAffiliate < 1) {
                        await products.findAndCountAll({
                            where: {
                                label: 'sport'
                            }
                        }).then(result => {
                            const count = result.count
                            const row = result.rows
                            console.log("pushing")
                            let int = Math.floor(Math.random() * count)
                            if (resultsAffiliate < 1) {
                                resultsAffiliate.push({
                                    vista: some, affiliate: row[int].dataValues,
                                    add: { id: parseInt(row[int].dataValues['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                    serv: serv,
                                    size: { w: img_width, h: img_height },
                                    mobile: mobile
                                })
                            }
                        })

                    }
                }
            }
            if (subscriptions['face'].length != 0) {
                if (subscriptions['face'][0].deep_face.gender[0]['label'] == 'Female') {
                    const gender = subscriptions['face'][0].deep_face.gender[0]['label']
                    const sub = subscriptions['fashion']
                    await clothing_Filler(sub, serv, img_width, img_height, site, url, uid, mobile, bool, gender, subscriptions['face'][0])
                        .then((result) => {
                            result.forEach(element => {
                                resultsAffiliate.push(element)
                            })
                        })

                }
                if (subscriptions['face'][0].deep_face.gender[0]['label'] == 'Male') {
                    const gender = subscriptions['face'][0].deep_face.gender[0]['label']
                    const sub = subscriptions['fashion']
                    await clothing_Filler(sub, serv, img_width, img_height, site, url, uid, mobile, bool, gender, subscriptions['face'][0])
                        .then((result) => {
                            result.forEach(element => {
                                resultsAffiliate.push(element)
                            })
                        })

                }
            }
            for (const obj of subscriptions['Object']) {
                 if (obj.class != 'person') {
                    if (objetos[0][obj.class] != undefined) {
                        if (obj.class == 'bottle')
                            console.log(obj)
                        if (obj.class == "bottle") {
                            console.log("ahi botellaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa")
                            if (resultsAffiliate.length < 2) {
                            await products.findAndCountAll({
                                where: {
                                    label: "cream"
                                }
                            })
                                .then(result => {
                                    const count = result.count
                                    const row = result.rows
                                    let int = Math.floor(Math.random() * count)
                                    resultsAffiliate.push({
                                        vista: obj, affiliate: row[int].dataValues,
                                        add: { id: parseInt(row[int].dataValues['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                        serv: serv,
                                        size: { w: img_width, h: img_height }
                                    })
                                }).catch((err) => {
                                    console.trace(err)
                                    console.error(err)
                                })
                            }
                        }
                        if (objetos[0][obj.class].length != 0 && obj.class != 'bottle') {
                            if (resultsAffiliate.length < 2) {
                                await object_Filler(obj, serv, img_width, img_height, site, url, uid, mobile)
                                    .then((result) => {
                                        result.forEach(element => {
                                            resultsAffiliate.push(element)
                                        })
                                    })
                            }
                        }
                    }
                }
            }
        }

        resolve(resultsAffiliate);
    })
}

const clothing_Filler = async (sub, serv, img_width, img_height, site, url, uid, mobile, bool, gender, face) => {
    const resultsAffiliate_Temp = []
    return new Promise(async (resolve) => {
        for (const obj in sub) {
            if (resultsAffiliate_Temp.length < 2) {
                if (sub[obj] != undefined) {
                    if (sub[obj].class == 'upper') {
                        await clothing.findAndCountAll({
                            where: {
                                label: {
                                    gender: gender,
                                    garment: 'shirt'
                                }
                            },
                        })
                            .then(result => {
                                const count = result.count
                                const row = result.rows
                                let int = Math.floor(Math.random() * count)
                                resultsAffiliate_Temp.push({
                                    vista: sub[obj], affiliate: row[int].dataValues,
                                    add: { id: parseInt(row[int].dataValues['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                    serv: serv,
                                    size: { w: img_width, h: img_height },
                                    mobile: mobile
                                })
                            }).catch((err) => {
                                console.error(err)
                            })
                    }
                    if (sub[obj].class == 'lower') {
                        await clothing.findAndCountAll({
                            where: {
                                label: {
                                    gender: gender,
                                    garment: 'pants'
                                }
                            },
                        })
                            .then(result => {
                                const count = result.count
                                const row = result.rows
                                let int = Math.floor(Math.random() * count)
                                resultsAffiliate_Temp.push({
                                    vista: sub[obj], affiliate: row[int].dataValues,
                                    add: { id: parseInt(row[int].dataValues['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                    serv: serv,
                                    size: { w: img_width, h: img_height },
                                    mobile: mobile
                                })
                            })
                    }
                    if (sub[obj].class == 'person' && bool) {
                        await clothing.findAndCountAll({
                            where: {
                                label: {
                                    gender: gender,
                                    garment: 'sports'
                                }
                            },
                        })
                            .then(result => {
                                const count = result.count
                                const row = result.rows
                                let int = Math.floor(Math.random() * count)
                                resultsAffiliate_Temp.push({
                                    vista: sub[obj], affiliate: row[int].dataValues,
                                    add: { id: parseInt(row[int].dataValues['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                                    serv: serv,
                                    size: { w: img_width, h: img_height }
                                })
                            })
                    }
                }
            }
        }
        resolve(resultsAffiliate_Temp)
    })
}

const object_Filler = async (obj, serv, img_width, img_height, site, url, uid, mobile) => {
    await clothing_Filler()
    return new Promise(async (resolve) => {
        const resultsAffiliate_Temp = []
        await products.findAndCountAll({
            where: {
                label: obj.class
            }
        })
            .then(result => {
                const count = result.count
                const row = result.rows
                let int = Math.floor(Math.random() * count)
                resultsAffiliate_Temp.push({
                    vista: obj, affiliate: row[int].dataValues,
                    add: { id: parseInt(row[int].dataValues['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                    serv: serv,
                    size: { w: img_width, h: img_height },
                    mobile: mobile
                })
            }).catch((err) => {
                console.error(err)
            })
        resolve(resultsAffiliate_Temp)

    })
}