const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const axios = require('axios')
const FormData = require('form-data')
const request = require('request')
const readCsv = require('./readCsv')
const convert = require('../helper/convertObject').convert
const dateFormat = require('dateformat')
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

  const {
    ad_type,
    img_width,
    img_height,
    ad_format,
    media_type,
    url,
    site,
    uid,
    serv,
    mobile,
  } = req.query
  let cachedImg = await cache.getAsync(
    `${mobile}_${img_width}_${img_height}_${url}`,
  )

  if (cachedImg)
    return res.status(200).send({
      results: JSON.parse(cachedImg),
    })

  await addImg(dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'), url, uid, site)
  let checker = site.split('/')[2]
  if (checker.includes('www.')) {
    checker = checker.split('w.')[1]
  }
  const aut = await auth(checker, site.split('/')[0])
  if (aut['enabled'] == false) {
    console.log('Cancelling')
    return res.status(400).json({ success: false, message: 'Unauthorized' })
  } else {
    let formData = new FormData()
    formData.append('upload', request(url))
    formData.append('subscriptions', 'face,fashion,Object,tags2,sport')
    const request_config = {
      method: 'post',
      url: vista_url + apiEndpoint,
      headers: {
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
      auth: {
        username: user,
        password: password,
      },
      data: formData,
    }
    console.log('Sending request')
    let extension = site.split(checker)
    let limit = 2
    if (aut['pages'] != null && JSON.parse(aut['pages'])[0] != null) {
      limit = JSON.parse(aut['pages'])[0][extension[1]]
    }
    try {
      console.log(
        '=====================> VISTA RESPONSE <========================',
      )
      const response = await axios(request_config)
      const objetos = await readCsv.readCsv(aut['idP'])
      console.log('objetos ============================', objetos)
      let resultsVista
      if (response.data) {
        resultsVista = response.data.results
      }
      console.log(
        'resultsVista ====================================',
        resultsVista,
      )
      const resultsAffiliate = await filler(
        resultsVista,
        serv,
        img_width,
        img_height,
        site,
        url,
        uid,
        objetos,
        mobile,
      )
      const flat = flatten(resultsAffiliate)
      if (flat.length > limit) {
        flat.length = limit
      }
      //   console.log('flat ================================ ', flat)
      const sendingResults = await convert(flat)
      await cache.setAsync(
        `${extension[1]}_${mobile}_${img_width}_${img_height}_${url}`,
        JSON.stringify(sendingResults),
        'EX',
        604800,
      )
      res.status(200).send({
        results: sendingResults,
      })
    } catch (err) {
      if (err.response) console.log(err.response.status, url)
      await cache.setAsync(
        `${extension[1]}_${mobile}_${img_width}_${img_height}_${url}`,
        JSON.stringify({}),
        'EX',
        604800,
      )
      console.trace(err)
      return res.status(500).json({
        success: false,
        message: 'Vista Image failled',
        error: err,
        img: url,
      })
    }
  }
})

const addImg = (time, imgName, idGeneration, site) => {
  return imgsPage.create({
    time: time,
    img: imgName,
    idGeneration: idGeneration,
    site: site,
  })
}
const filler = (
  resultsVista,
  serv,
  img_width,
  img_height,
  site,
  url,
  uid,
  objetos,
  mobile,
) => {
  const resultsAffiliate = []
  return new Promise((resolve) => {
    if (resultsVista.sport.length != 0) {
      const bool = true
      for (const obj of resultsVista.sport) {
        const result = sport_makeup_Filler(
          bool,
          obj,
          objetos,
          serv,
          img_width,
          img_height,
          site,
          url,
          uid,
          mobile,
        )
        if (result.length != 0) {
          resultsAffiliate.push(result)
        }
      }
    } else if (resultsVista.tags2.tags2.tags2.length != 0) {
      if (
        resultsVista.tags2.tags2.tags2[0].label.includes(
          'LIPSTICK' || 'HAIR' || 'FACE' || 'PERFUME' || 'PAINTBRUSH',
        ) ||
        resultsVista.tags2.tags2.tags2[0].IAB.includes('IAB17-')
      ) {
        const bool = false
        for (const obj of resultsVista.tags2.tags2.tags2) {
          const result = sport_makeup_Filler(
            bool,
            obj,
            objetos,
            serv,
            img_width,
            img_height,
            site,
            url,
            uid,
            mobile,
          )
          if (result.length != 0) {
            resultsAffiliate.push(result)
          }
        }
      }
    }
    if (resultsVista['fashion'].length != 0) {
      if (
        resultsVista['face'].length != 0 &&
        resultsVista['fashion'][0].confidence > 0.6
      ) {
        const gender = resultsVista.face[0].deep_gender.gender[0].label
        for (const obj of resultsVista['fashion']) {
          const result = clothing_Filler(
            obj,
            gender,
            objetos,
            serv,
            img_width,
            img_height,
            site,
            url,
            uid,
            mobile,
          )
          if (result.length != 0) {
            resultsAffiliate.push(result)
          }
        }
      }
    }
    for (const obj of resultsVista['Object']) {
      if (obj.class != 'person') {
        if (obj.class == 'bottle') {
          const result = objetos.filter(
            (obj2) => obj2.label == 'makeup' && obj2.Type == 'products',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
          })
        } else {
          const result = object_Filler(
            obj,
            objetos,
            serv,
            img_width,
            img_height,
            site,
            url,
            uid,
            mobile,
          )
          if (result.length != 0) {
            resultsAffiliate.push(result)
          }
        }
      }
    }
    resolve(resultsAffiliate)
  })
}

const clothing_Filler = (
  obj,
  gender,
  objetos,
  serv,
  img_width,
  img_height,
  site,
  url,
  uid,
  mobile,
) => {
  const resultsAffiliate_Temp = []
  if (resultsAffiliate_Temp.length < 2) {
    if (gender == 'Male') {
      if (obj.class == 'upper' && obj.confidence > 0.6) {
        if (
          obj.deep_fashion_tf.sleeve_length[0].label == 'ExtraLongSleeves' ||
          obj.deep_fashion_tf.sleeve_length[0].label == 'LongSleeves'
        ) {
          const result = objetos.filter(
            (obj2) =>
              obj2.Gender == gender && obj2.Category_Name == 'Outerwear',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        } else if (
          obj.deep_fashion_neckline.neckline[0].label == 'shirtcollar'
        ) {
          const result = objetos.filter(
            (obj2) => obj2.Gender == gender && obj2.Category_Name == 'Shirts',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        } else if (
          obj.deep_fashion_neckline.neckline[0].label == 'poloshirtcollar'
        ) {
          const result = objetos.filter(
            (obj2) =>
              obj2.Gender == gender && obj2.Category_Name == 'Polo Shirts',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        } else {
          const result = objetos.filter(
            (obj2) => obj2.Gender == gender && obj2.Category_Name == 'T-Shirts',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        }
      }
      if (obj.class == 'lower' && obj.confidence > 0.6) {
        if (
          obj.deep_fashion_tf.pant_length[0].label == 'FullLength' ||
          obj.deep_fashion_tf.pant_length[0].label == 'CroppedPant' ||
          (obj.deep_fashion_tf.pant_length[0].label == '3/4Length' &&
            obj.deep_fashion_color.color[0].label == 'blue')
        ) {
          const result_temp = objetos.filter(
            (obj2) => obj2.Gender == gender && obj2.Category_Name == 'Jeans',
          )
          const result = result_temp.filter(
            (obj3) => obj3.Sub_Category_Name != 'Short Jeans',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        }
        if (
          obj.deep_fashion_tf.pant_length[0].label == 'FullLength' ||
          obj.deep_fashion_tf.pant_length[0].label == 'CroppedPant' ||
          obj.deep_fashion_tf.pant_length[0].label == '3/4Length'
        ) {
          const result = objetos.filter(
            (obj2) =>
              obj2.Gender == gender && obj2.Category_Name == 'Long Pants',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        } else {
          const result = objetos.filter(
            (obj2) => obj2.Gender == gender && obj2.Category_Name == 'Shorts',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        }
      }
    }
    if (gender == 'Female') {
      if (obj.class == 'upper' && obj.confidence > 0.6) {
        if (
          obj.deep_fashion_tf.sleeve_length[0].label == 'ExtraLongSleeves' ||
          obj.deep_fashion_tf.sleeve_length[0].label == 'LongSleeves'
        ) {
          const prendras = objetos.filter((obj2) => {
            if (obj2.Gender == gender && obj2.Category_Name == 'Outerwear')
              return true
          })
          const count = prendras.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: prendras[int],
            add: {
              id: parseInt(prendras[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        } else {
          const prendras = objetos.filter((obj2) => {
            if (obj2.Gender == gender && obj2.Category_Name == 'Tops')
              return true
          })
          const count = prendras.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: prendras[int],
            add: {
              id: parseInt(prendras[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        }
      }
      if (obj.class == 'lower' && obj.confidence > 0.6) {
        if (
          obj.deep_fashion_tf.pant_length[0].label == 'FullLength' ||
          obj.deep_fashion_tf.pant_length[0].label == 'CroppedPant' ||
          obj.deep_fashion_tf.pant_length[0].label == '3/4Length'
        ) {
          const result = objetos.filter(
            (obj2) =>
              obj2.Gender == gender && obj2.Sub_Category_Name == 'Shorts',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        } else {
          const result_temp = objetos.filter(
            (obj2) =>
              obj2.Gender == gender && obj2.Category_Name == 'Pants & Leggings',
          )
          const result = result_temp.filter(
            (obj3) => obj3.Sub_Category_Name != 'Shorts',
          )
          const count = result.length - 1
          if (count == -1) {
            return []
          }
          let int = Math.floor(Math.random() * count)
          resultsAffiliate_Temp.push({
            vista: obj,
            affiliate: result[int],
            add: {
              id: parseInt(result[int]['Merchant_Product_ID']),
              site: site,
              date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
              url: url,
              uid: uid,
            },
            serv: serv,
            size: { w: img_width, h: img_height },
            mobile: mobile,
          })
        }
      }
    }
  }
  return resultsAffiliate_Temp
}

const object_Filler = (
  obj,
  objetos,
  serv,
  img_width,
  img_height,
  site,
  url,
  uid,
  mobile,
) => {
  const resultsAffiliate_Temp = []
  if (resultsAffiliate_Temp.length < 2) {
    const result = objetos.filter(
      (obj2) =>
        obj2.label == obj.class &&
        obj2.Type == 'products' &&
        obj.confidence >= 0.6,
    )
    const count = result.length - 1
    if (count == -1) {
      return []
    }
    const int = Math.floor(Math.random() * count)
    resultsAffiliate_Temp.push({
      vista: obj,
      affiliate: result[int],
      add: {
        id: parseInt(result[int]['Merchant_Product_ID']),
        site: site,
        date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
        url: url,
        uid: uid,
      },
      serv: serv,
      size: { w: img_width, h: img_height },
      mobile: mobile,
    })
  }
  return resultsAffiliate_Temp
}

const sport_makeup_Filler = (
  bool,
  obj,
  objetos,
  serv,
  img_width,
  img_height,
  site,
  url,
  uid,
  mobile,
) => {
  const resultsAffiliate_Temp = []
  if (resultsAffiliate_Temp.length < 2) {
    if (bool) {
      if (obj.class.includes('Beauty')) {
        const result = objetos.filter(
          (obj2) => obj2.label == 'makeup' && obj2.Type == 'products',
        )
        const count = result.length - 1
        if (count == -1) {
          return []
        }
        let int = Math.floor(Math.random() * count)
        resultsAffiliate_Temp.push({
          vista: obj,
          affiliate: result[int],
          add: {
            id: parseInt(result[int]['Merchant_Product_ID']),
            site: site,
            date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            url: url,
            uid: uid,
          },
          serv: serv,
          size: { w: img_width, h: img_height },
          mobile: mobile,
        })
      }
      if (obj.class.includes('Sports')) {
        const result = objetos.filter(
          (obj2) => obj2.label == 'sport' && obj2.Type == 'products',
        )
        const count = result.length - 1
        if (count == -1) {
          return []
        }
        let int = Math.floor(Math.random() * count)
        resultsAffiliate_Temp.push({
          vista: obj,
          affiliate: result[int],
          add: {
            id: parseInt(result[int]['Merchant_Product_ID']),
            site: site,
            date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            url: url,
            uid: uid,
          },
          serv: serv,
          size: { w: img_width, h: img_height },
          mobile: mobile,
        })
      }
    } else {
      if (
        obj.label.includes(
          'LIPSTICK' || 'HAIR' || 'FACE' || 'PERFUME' || 'PAINTBRUSH',
        )
      ) {
        const result = objetos.filter(
          (obj2) => obj2.label == 'makeup' && obj2.Type == 'products',
        )
        const count = result.length - 1
        if (count == -1) {
          return []
        }
        let int = Math.floor(Math.random() * count)
        resultsAffiliate_Temp.push({
          vista: obj,
          affiliate: result[int],
          add: {
            id: parseInt(result[int]['Merchant_Product_ID']),
            site: site,
            date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            url: url,
            uid: uid,
          },
          serv: serv,
          size: { w: img_width, h: img_height },
          mobile: mobile,
        })
      }
      if (obj.IAB.includes('IAB17')) {
        const result = objetos.filter(
          (obj2) => obj2.label == 'sport' && obj2.Type == 'products',
        )
        const count = result.length - 1
        if (count == -1) {
          return []
        }
        let int = Math.floor(Math.random() * count)
        resultsAffiliate_Temp.push({
          vista: obj,
          affiliate: result[int],
          add: {
            id: parseInt(result[int]['Merchant_Product_ID']),
            site: site,
            date: dateFormat(new Date(), 'yyyy-mm-dd HH:MM:ss'),
            url: url,
            uid: uid,
          },
          serv: serv,
          size: { w: img_width, h: img_height },
          mobile: mobile,
        })
      }
    }
  }
  return resultsAffiliate_Temp
}

const flatten = (ary) => {
  return ary.reduce((a, b) => {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}
