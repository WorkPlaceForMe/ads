const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const axios = require('axios')
const FormData = require('form-data')
const request = require('request')
const readCsv = require('./readCsv')
const convert = require('../helper/convertObject').convert
const dateFormat = require('dateformat')
const auth = require('../helper/auth')
const cache = require('../helper/cacheManager')
const db1 = require('../campaigns-db/database')
const imgsPage = db1.imgsPage
const publishers = db1.publishers
const clientImgPubl = db1.clientImgPubl

exports.getAllClientData = Controller(async (req, res) => {
  const data = {}
  const cientImgPublDataList = await getAllCientImgPublData()

  if(cientImgPublDataList){
    cientImgPublDataList.forEach((elem) => {
      const clientId = elem.clientId
      const sessionId = elem.sessionId
      const imgUrl = elem.imgUrl
      const duration = elem.duration
      const publisherId = elem.publId
      let clientData = data[clientId]

      if(!clientData){
        clientData = {}
      }

      let sessionData = clientData[sessionId]

      if(!sessionData){
        sessionData = []
      }

      sessionData.push({
        imgUrl,
        duration,
        publisherId
      })

      clientData[sessionId] = sessionData
      data[clientId] = clientData
    })
  }


  res.status(200).send({
    results: data
  })
})

exports.getAds = Controller(async (req, res) => {
  // Disable SSL certificate
  process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

  // get property values
  const vista_url = conf.get('vista_api_url')
  const user = conf.get('vista_api_user')
  const password = conf.get('vista_api_password')

  const apiEndpoint = '/api/v1/sync'
  let img = null;
  let publisher = null;
    
  // getting query strings
  const { img_width, img_height, url, site, uid, serv, mobile, userId, sessionId } = req.query
  let checker = site.split('/')[2];
  if (checker.includes('www.')) {
      checker = checker.split('w.')[1]
  }
  
  let extension = site.split(checker)
  let cachedImg = await cache.getAsync(`${extension[1]}_${mobile}_${img_width}_${img_height}_${url}`)

  const aut = await auth(checker, site.split('/')[0])
  
  if(aut['enabled'] == false) {
    console.log("Cancelling")
    return res.status(400).json({ success: false, message: "Unauthorized" })
  }
  
  if (cachedImg && cachedImg !== '{}' && cachedImg !== '[]'){
    img = await getImg(url)
    publisher = await getPublisher(checker)

    if(img && publisher){
      await createClientImgPublData(userId, sessionId, img.id, img.img, publisher.id)
    }

    return res.status(200).send({
        results: JSON.parse(cachedImg)
    })
  } else{
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
       
    let limit = 4
    
    if(aut['pages'] != null && JSON.parse(aut['pages'])[0] != null){
        limit = JSON.parse(aut['pages'])[0][extension[1]]
    }
    
    try {
      console.log("Sending request to Vista Server")
      const response = await axios(request_config)
      console.log("Response received from Vista Server")
      const objetos = await readCsv.readCsv(aut['idP'])
      let resultsVista
      if (response.data) {
          resultsVista = response.data.results
      }
      const resultsAffiliate = await filler(resultsVista, serv, img_width, img_height, site, url, uid, objetos, mobile)
      const flat = flatten(resultsAffiliate)
      if (flat.length > limit) {
          flat.length = limit
      }
      const sendingResults = await convert(flat)
      cache.setAsync(`${extension[1]}_${mobile}_${img_width}_${img_height}_${url}`, JSON.stringify(sendingResults))

      img = await getImg(url)

      if(!img){
        img = await addImg(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), url, uid, site)
      }
      
      publisher = await getPublisher(checker);

      if(img && publisher){
        await createClientImgPublData(userId, sessionId, img.id, img.img, publisher.id);
      }
        
      res.status(200).send({
        results: sendingResults
      })
    } catch (err) {
      console.log('Error in processing')
      console.log(err)
      cache.setAsync(`${extension[1]}_${mobile}_${img_width}_${img_height}_${url}`, JSON.stringify({}));
      return res.status(500).json({ success: false, message: "Vista Image failled", error: err, img: url })
    }
  }
})

function getAllCientImgPublData(site) {
  return db1.clientImgPubl.findAll();
}

const addImg = (time, imgName, idGeneration, site) => {
  return imgsPage.create({
    time: time,
    img: imgName,
    idGeneration: idGeneration,
    site: site,
  })
}

const getImg = (url) => {
  return imgsPage.findOne({
    where: { img: url }
  })
}

const getPublisher = (site) => {
  return publishers.findOne({
    where: { name: site }
  })
}

function createClientImgPublData(clientId, sessionId, imageId, imgUrl, publisherId) {
  return clientImgPubl.create({
        clientId: clientId,
        sessionId: sessionId,
        imgId: imageId,
        imgUrl: imgUrl,
        publId: publisherId
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
      if (resultsVista.tags2.tags2.tags2[0].label.toLowerCase().includes('lipstick') || resultsVista.tags2.tags2.tags2[0].label.toLowerCase().includes('hair') 
          ||  resultsVista.tags2.tags2.tags2[0].label.toLowerCase().includes('face')
          ||  resultsVista.tags2.tags2.tags2[0].label.toLowerCase().includes('perfume') || resultsVista.tags2.tags2.tags2[0].label.toLowerCase().includes('paintbrush')
          ||  resultsVista.tags2.tags2.tags2[0].IAB.includes('IAB17-')) {
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
          if(obj.class === 'cell_phone'){
            obj.class = 'mobile'
          }

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
  
  if (gender == 'Male') {
    if (obj.class == 'upper' && obj.confidence > 0.6) {
      if (obj.deep_fashion_tf.sleeve_length[0].label == 'ExtraLongSleeves' ||
        obj.deep_fashion_tf.sleeve_length[0].label == 'LongSleeves') {
        const result = objetos.filter(
          (obj2) =>
            obj2.Gender == gender && obj2.Sub_Category_Name.toLowerCase().includes('jackets')
            && !obj2.Main_Category_Name.toLowerCase().includes('women')
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
        typeof obj.deep_fashion_neckline.neckline !== 'undefined' && obj.deep_fashion_neckline.neckline[0].label == 'shirtcollar'
      ) {
        const result = objetos.filter(
          (obj2) => obj2.Sub_Category_Name.toLowerCase().includes('shirts')
          && !obj2.Main_Category_Name.toLowerCase().includes('women')
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
        typeof obj.deep_fashion_neckline.neckline !== 'undefined' && obj.deep_fashion_neckline.neckline[0].label == 'poloshirtcollar'
      ) {
        const result = objetos.filter(
          (obj2) =>
            obj2.Gender == gender && obj2.Sub_Category_Name.toLowerCase().includes('polos')
            && !obj2.Main_Category_Name.toLowerCase().includes('women')
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
          (obj2) => obj2.Gender == gender && (obj2.Sub_Category_Name.toLowerCase().includes('t-shirts') 
          || obj2.Sub_Category_Name.toLowerCase().includes('tshirts'))
          && !obj2.Main_Category_Name.toLowerCase().includes('women')
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
        obj.deep_fashion_tf.pant_length[0].label == '3/4Length'
      ) {
        const result = objetos.filter(
          (obj2) => obj2.Gender == gender && (obj2.Sub_Category_Name.toLowerCase().includes('pants') 
          || obj2.Sub_Category_Name.toLowerCase().includes('bottoms')) 
          && !obj2.Main_Category_Name.toLowerCase().includes('women')
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
      if (obj.deep_fashion_tf.sleeve_length[0].label == 'ExtraLongSleeves' ||
        obj.deep_fashion_tf.sleeve_length[0].label == 'LongSleeves'
      ) {
        const prendras = objetos.filter((obj2) => obj2.Gender == gender 
        && obj2.Sub_Category_Name.toLowerCase().includes('jackets'))
        
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
        const prendras = objetos.filter((obj2) =>
          obj2.Sub_Category_Name.toLowerCase().includes('tops')
          && obj2.Main_Category_Name.toLowerCase().includes('women'))
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
            obj2.Gender == gender && (obj2.Sub_Category_Name.toLowerCase().includes('pants') 
            || obj2.Sub_Category_Name.toLowerCase().includes('bottoms'))
            && !obj2.Main_Category_Name.toLowerCase().includes('men')
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
          (obj2) =>
            obj2.Gender == gender && (obj2.Sub_Category_Name.toLowerCase().includes('pants')
            || obj2.Sub_Category_Name.toLowerCase().includes('leggings'))
            && !obj2.Main_Category_Name.toLowerCase().includes('men')
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
  const result = objetos.filter(
    (obj2) =>
      obj2.Sub_Category_Name &&
      obj2.Sub_Category_Name.toLowerCase().includes(
      obj.class) &&
      obj2.Type == 'products' &&
      obj.confidence >= 0.6
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
 
  if (bool) {
    if (obj.class.toLowerCase().includes('beauty')) {
      const result = objetos.filter(
        (obj2) => (obj2.Main_Category_Name.toLowerCase().includes('beauty') || obj2.Main_Category_Name.toLowerCase().includes('makeup') || obj2.Main_Category_Name.toLowerCase().includes('make-up'))
         && obj2.Type == 'products'
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
    if (obj.class.toLowerCase().includes('sport')) {
      const result = objetos.filter(
        (obj2) => obj2.Category_Name
        && obj2.Category_Name.toLowerCase().includes('sport')
        && !obj2.Category_Name.toLowerCase().includes('sportswear')
        && obj2.label
        && obj2.label.toLowerCase().includes('sport')        
        && obj2.Type == 'products'
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
    if (obj.label.toLowerCase().includes('lipstick') || obj.label.toLowerCase().includes('hair') || obj.label.toLowerCase().includes('face')
       ||  obj.label.toLowerCase().includes('perfume') || obj.label.toLowerCase().includes('paintbrush')) {
      const result = objetos.filter(
        (obj2) => (obj2.Main_Category_Name.toLowerCase().includes('beauty') || obj2.Main_Category_Name.toLowerCase().includes('makeup') || obj2.Main_Category_Name.toLowerCase().includes('make-up'))
         && obj2.Type == 'products'
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
        (obj2) => obj2.Main_Category_Name
        && obj2.Main_Category_Name.toLowerCase().includes('sport')
        && !obj2.Main_Category_Name.toLowerCase().includes('sportswear')
        && obj2.label
        && obj2.label.toLowerCase().includes('sport')        
        && obj2.Type == 'products'
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