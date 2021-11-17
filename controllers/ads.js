const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const axios = require('axios')
const FormData = require('form-data')
const request = require('request')
const readCsv = require('./readCsv')
const convert = require('../helper/convertObject').convert
const dateFormat = require('dateformat');
const auth = require('../helper/auth')
const util = require('util')
const cache = require('../helper/cacheManager')
const db1 = require('../campaigns-db/database')
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

            formData.append('subscriptions', 'face,fashion,Object,tags2,sport')

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
                const objetos = await readCsv.readCsv(aut['idP'])
                let resultsVista = []
                if (response.data) {
                    resultsVista.push(response.data.results)
                }
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
    const resultsAffiliate = []
    for (const subscriptions of resultsVista) {
        if (subscriptions['sport'] != []) {
            for (const some of subscriptions['sport']) {
                const Products_Sport = objetos.filter(obj => obj.label == 'sport' && obj.Type == 'products')
                const count = Products_Sport.length
                let int = Math.floor(Math.random() * count)
                resultsAffiliate.push({
                    vista: some, affiliate: Products_Sport[int],
                    add: { id: parseInt(Products_Sport[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                    serv: serv,
                    size: { w: img_width, h: img_height },
                    mobile: mobile
                })
            }
        }
        if (subscriptions['face'].length != 0) {
            if (subscriptions['face'][0].deep_face.gender[0]['label'] == 'Female') {
                const gender = subscriptions['face'][0].deep_face.gender[0]['label']
                const sub = subscriptions['fashion']
                const result = await clothing_Filler(sub, objetos, serv, img_width, img_height, site, url, uid, mobile, gender)
                result.forEach(element => {
                    resultsAffiliate.push(element)
                })
            }
            else if (subscriptions['face'][0].deep_face.gender[0]['label'] == 'Male') {
                const gender = subscriptions['face'][0].deep_face.gender[0]['label']
                const sub = subscriptions['fashion']
                const result = await clothing_Filler(sub, objetos, serv, img_width, img_height, site, url, uid, mobile, gender)
                result.forEach(element => {
                    resultsAffiliate.push(element)
                })
            }
        }
        for (const obj of subscriptions['Object']) {
            if (obj.class != 'person') {
                if (obj.class == "bottle") {
                    if (resultsAffiliate.length < 2) {
                        const result = objetos.filter(obj2 => obj2.label == 'cream' && obj2.Type == "products")
                        const count = result.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate.push({
                            vista: obj, affiliate: result[int],
                            add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height }
                        })
                    }
                }
                if (resultsAffiliate.length < 2) {
                    const result = await object_Filler(obj, objetos, serv, img_width, img_height, site, url, uid, mobile)
                    result.forEach(element => {
                        resultsAffiliate.push(element)
                    })
                }
            }
        }
    }

    return (resultsAffiliate);

}

const clothing_Filler = async (sub, objetos, serv, img_width, img_height, site, url, uid, mobile, gender) => {
    const resultsAffiliate_Temp = []
    for (const obj of sub) {
        if (resultsAffiliate_Temp.length < 2) {
            if (gender == "Male") {
                if (obj.class == 'upper' && obj.confidence > 0.6) {
                    if (obj.deep_fashion_tf.collar_design[0] == 'Shirt') {
                        const result = objetos.filter(obj2 => obj2.Gender == gender && obj2.Category_Name == 'Shirts')
                        const count = result.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: result[int],
                            add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                    else {
                        const result = objetos.filter(obj2 => obj2.Gender == gender && obj2.Category_Name == 'T-Shirts')
                        const count = result.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: result[int],
                            add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                }
                if (obj.class == 'lower' && obj.confidence > 0.6) {
                    if (obj.deep_fashion_tf.pant_length[0] == 'FullLength') {
                        const result = objetos.filter(obj2 => obj2.Gender == gender && obj2.Category_Name == 'Long Pants')
                        const count = result.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: result[int],
                            add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                    else {
                        const result = objetos.filter(obj2 => obj2.Gender == gender && obj2.Category_Name == 'Shorts')
                        const count = result.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: result[int],
                            add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                }
            }
            if (gender == "Female") {
                if (obj.class == 'upper' && obj.confidence > 0.6) {
                    if (obj.deep_fashion_tf.collar_design[0] == 'Shirt') {
                        const prendras = objetos.filter(obj2 => {
                            if (obj2.Gender == gender && obj2.Sub_Category_Name == 'Shirts')
                                return true
                        })
                        const count = prendras.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: prendras[int],
                            add: { id: parseInt(prendras[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                    else {
                        const prendras = objetos.filter(obj2 => {
                            if (obj2.Gender == gender && obj2.Category_Name == 'Tops')
                                return true
                        })
                        const count = prendras.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: prendras[int],
                            add: { id: parseInt(prendras[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                }
                if (obj.class == 'lower' && obj.confidence > 0.6) {
                    if (obj.deep_fashion_tf.pant_length[0] == 'FullLength') {
                        const result = objetos.filter(obj2 => obj2.Gender == gender && obj2.Sub_Category_Name == 'Pants')
                        const count = result.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: result[int],
                            add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                    else {
                        const result = objetos.filter(obj2 => obj2.Gender == gender && obj2.Category_Name == 'Jeans')
                        const count = result.length
                        let int = Math.floor(Math.random() * count)
                        resultsAffiliate_Temp.push({
                            vista: obj, affiliate: result[int],
                            add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
                            serv: serv,
                            size: { w: img_width, h: img_height },
                            mobile: mobile
                        })
                    }
                }
            }
        }
    }
    return (resultsAffiliate_Temp)
}

const object_Filler = async (obj, objetos, serv, img_width, img_height, site, url, uid, mobile) => {
    const resultsAffiliate_Temp = []
    const result = objetos.filter(obj2 => obj2.label == obj.class)
    const count = result.length
    let int = Math.floor(Math.random() * count)
    resultsAffiliate_Temp.push({
        vista: obj, affiliate: result[int],
        add: { id: parseInt(result[int]['Merchant_Product_ID']), site: site, date: dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url: url, uid: uid },
        serv: serv,
        size: { w: img_width, h: img_height },
        mobile: mobile
    })
    return (resultsAffiliate_Temp)

}
