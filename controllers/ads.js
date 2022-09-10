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
const { getStrippedURL, shuffleArray } = require('../helper/util')
const { productAliases } = require('../helper/productAliases')
const db1 = require('../campaigns-db/database')
const imgsPage = db1.imgsPage
const publishers = db1.publishers
const clientImgPubl = db1.clientImgPubl
const clientSession = db1.clientSession

exports.sessionData = Controller(async (req, res) => {
  updateSessionData(req.query.sessionId, 5).then().catch(err => {
    console.error(err, 'Error occurred in session duration saving')
  })

  res.status(200).send({
    success: true, message: "Session data saved"
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
    
  // getting query strings
  let { img_width, img_height, url, site, uid, serv, mobile, userId, sessionId } = req.query

  if(site){
    site = decodeURIComponent(site)
    site = getStrippedURL(site)
  }

  if(url){
    url = decodeURIComponent(url)
  }

  let checker = site.split('/')[2];
  if (checker.includes('www.')) {
      checker = checker.split('w.')[1]
  }
  
  let extension = site.split(checker)

  const aut = await auth(checker, site.split('/')[0])
  
  if(aut['enabled'] == false) {
    console.log("Cancelling")
    return res.status(400).json({ success: false, message: "Unauthorized" })
  }

  try {
    let cachedImg = await cache.getAsync(`${checker}_${url}`)  
    
    if (cachedImg && cachedImg !== '{}' && cachedImg !== '[]'){
      addImagePublisherMetadata(url, site, checker, uid, userId, sessionId).then().catch(err => {
        console.error(err, 'Error occurred in client publisher data saving')
      })

      return res.status(200).send({
          results: JSON.parse(cachedImg)
      })
    } else{
      let formData = new FormData()
      formData.append('upload', request(encodeURI(url)))
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
       

      let publisher = await cache.getAsync(`${checker}-publisher`)

      if(publisher){
        publisher = JSON.parse(publisher)
      } else {
        publisher = await getPublisher(checker)
        cache.setAsync(`${checker}-publisher`, JSON.stringify(publisher)).then()
      }

      let limit = publisher ? publisher.adsperimage : 1
  
      console.log(`Sending request to Vista Server for image ${url}`)
      const response = await axios(request_config)
      console.log(`Response received from Vista Server for image ${url}`)
      const objetos = await readCsv.readCsv(aut['idP'])
      let resultsVista
      
      if (response.data) {
          resultsVista = response.data.results
      }
      
      const resultsAffiliate = await filler(resultsVista, serv, img_width, img_height, site, url, uid, shuffleArray(objetos), mobile)
   
      resultsAffiliate.sort((item1, item2) => item2[0].vista.confidence - item1[0].vista.confidence)
      
      let flat = flatten(resultsAffiliate)
      
      if (flat.length > limit) {
        flat.length = limit
      }
      
      const sendingResults = await convert(flat)      
      
      cache.setAsync(`${checker}_${url}`, JSON.stringify(sendingResults))
         
      addImagePublisherMetadata(url, site, checker, uid, userId, sessionId).then().catch(err => {
        console.error(err, 'Error occurred in client publisher data saving')
      })  
    
      res.status(200).send({
        results: sendingResults
      })
    } 
  } catch (err) {
      console.log('Error in processing')
      console.log(err)
      cache.setAsync(`${checker}_${url}`, JSON.stringify({}));
      return res.status(500).json({ success: false, message: "Vista Image failled", error: err, img: url })
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

const getImg = (url, site) => {
  return imgsPage.findOne({
    where: { img: url, site: site}
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

function updateClientSessionData(sessionId, timeSlice) {
  return clientSession.increment(
    { duration: +timeSlice },
    {
      where: { id: sessionId }
    }
  )
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
      for (const obj of resultsVista.sport) {
          const result = sport_makeup_Filler(
            true,
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
    
    if (resultsVista.tags2.tags2.tags2.length != 0) {      
        for (const obj of resultsVista.tags2.tags2.tags2) {
          if ((obj.label && (obj.label.toLowerCase().includes('lipstick') || obj.label.toLowerCase().includes('hair') 
          ||  obj.label.toLowerCase().includes('face')
          ||  obj.label.toLowerCase().includes('perfume') || obj.label.toLowerCase().includes('paintbrush')
          ||  obj.IAB))) {  
            const result = sport_makeup_Filler(
              false,
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
    
    if (resultsVista['fashion'].length != 0 && resultsVista['face'].length != 0) {
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

    if (resultsVista['Object'].length != 0) {
      for (const obj of resultsVista['Object']) {
        if (obj.class != 'person') {
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

    const uniqueProductIdList = []
    
    const uniqueItems =  resultsAffiliate.filter(item => {
        let valueDoesNotExits = uniqueProductIdList.indexOf(item[0].affiliate.Merchant_Product_ID) == -1
        uniqueProductIdList.push(item[0].affiliate.Merchant_Product_ID)

        return valueDoesNotExits
    })
    
    resolve(shuffleArray(uniqueItems))
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
    if ((obj.class == 'person' || obj.class == 'upper')) {
      if (obj.deep_fashion_tf.sleeve_length[0].label == 'ExtraLongSleeves' ||
        obj.deep_fashion_tf.sleeve_length[0].label == 'LongSleeves') {
        const result = objetos.filter(
          (obj2) =>
            obj2.Gender == gender && obj2.Sub_Category_Name.toLowerCase().includes('jacket')
        )
        const count = result.length - 1

        if(count >= 0){
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
      } else if (
        typeof obj.deep_fashion_neckline.neckline !== 'undefined' && obj.deep_fashion_neckline.neckline[0].label == 'shirtcollar'
      ) {
        const result = objetos.filter(
          (obj2) => obj2.Sub_Category_Name.toLowerCase().includes('shirts')
          && !obj2.Main_Category_Name.toLowerCase().includes('women')
        )
        const count = result.length - 1

        if(count >= 0){
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
      } else if (
        typeof obj.deep_fashion_neckline.neckline !== 'undefined' && obj.deep_fashion_neckline.neckline[0].label == 'poloshirtcollar'
      ) {
        const result = objetos.filter(
          (obj2) =>
            obj2.Gender == gender && obj2.Sub_Category_Name.toLowerCase().includes('polos')
            && !obj2.Main_Category_Name.toLowerCase().includes('women')
        )
        const count = result.length - 1
        if(count >= 0){
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
        const result = objetos.filter(
          (obj2) => obj2.Gender == gender && (obj2.Sub_Category_Name.toLowerCase().includes('t-shirts') 
          || obj2.Sub_Category_Name.toLowerCase().includes('tshirts'))
          && !obj2.Main_Category_Name.toLowerCase().includes('women')
        )
        const count = result.length - 1
        if(count >= 0){
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
    if (obj.class == 'lower') {
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
        if(count >= 0){
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
  if (gender == 'Female') {
    if (obj.class == 'person' || obj.class == 'upper') {
      if (obj.deep_fashion_tf.sleeve_length[0].label == 'ExtraLongSleeves' ||
        obj.deep_fashion_tf.sleeve_length[0].label == 'LongSleeves'
      ) {
        const prendras = objetos.filter((obj2) => obj2.Sub_Category_Name.toLowerCase().includes('jackets'))        
        const count = prendras.length - 1

        if(count >= 0){
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
      } else {
        const prendras = objetos.filter((obj2) =>
          obj2.Sub_Category_Name.toLowerCase().includes('tops')
          && obj2.Main_Category_Name.toLowerCase().includes('women'))
        const count = prendras.length - 1
        let int = Math.floor(Math.random() * count)

        if(count >= 0){
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
    }
    if (obj.class == 'lower') {
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

        if(count >= 0){
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
        const result = objetos.filter(
          (obj2) =>
            obj2.Gender == gender && (obj2.Sub_Category_Name.toLowerCase().includes('pants')
            || obj2.Sub_Category_Name.toLowerCase().includes('leggings'))
            && !obj2.Main_Category_Name.toLowerCase().includes('men')
        )
        const count = result.length - 1

        if(count >= 0){
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
  const result = objetos.filter(
    (obj2) => 
      matchCategoryWithProductAliases(obj2.Sub_Category_Name, obj.class) &&
      obj2.Type == 'products'
  )
  const count = result.length - 1

  if(count >= 0){
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
 
  if (bool) {
    if (obj.class && obj.class.toLowerCase().includes('beauty')) {
      const result = objetos.filter(
        (obj2) => (obj2.Main_Category_Name.toLowerCase().includes('beauty') || obj2.Main_Category_Name.toLowerCase().includes('makeup') || obj2.Main_Category_Name.toLowerCase().includes('make-up'))
         && obj2.Type == 'products'
      )
      const count = result.length - 1

      if(count >= 0){
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
    if (obj.class && obj.class.toLowerCase().includes('sport')) {
      const result = objetos.filter(
        (obj2) => obj2.Category_Name
        && obj2.Category_Name.toLowerCase().includes('sport')
        && !obj2.Category_Name.toLowerCase().includes('sportswear')
        && obj2.label
        && obj2.label.toLowerCase().includes('sport')        
        && obj2.Type == 'products'
      )
      const count = result.length - 1

      if(count >= 0){
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

  if (obj.label && (obj.label.toLowerCase().includes('lipstick') || obj.label.toLowerCase().includes('hair') || obj.label.toLowerCase().includes('face')
       ||  obj.label.toLowerCase().includes('perfume') || obj.label.toLowerCase().includes('paintbrush'))) {
      const result = objetos.filter(
        (obj2) => (obj2.Main_Category_Name.toLowerCase().includes('beauty') || obj2.Main_Category_Name.toLowerCase().includes('makeup') || obj2.Main_Category_Name.toLowerCase().includes('make-up'))
          && obj2.Type == 'products'
      )
      const count = result.length - 1
      
      if(count >= 0){
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

    if (obj.IAB && obj.label) {
      let result = objetos.filter(
          (obj2) => (matchCategoryWithProductAliases(obj2.Sub_Category_Name, obj.label)   
          && obj2.Type == 'products')
        )

      const count = result.length - 1
      let int = Math.floor(Math.random() * count)

      if(count >= 0){
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

const getDiversifiedResults = (data, limit) => {
  const newData = []
  const rejectedData = []
  const subCategories = []

  for (const item of data) {
    if(newData.length >= limit){
      break
    }
    
    const subCategory = item.affiliate.Sub_Category_Name
    
    if(!subCategory || !subCategories.includes(subCategory)){
      newData.push(item)
      subCategories.push(subCategory)
    } else {
      rejectedData.push(item)
    }
  }

  if(newData.length < limit){
    for (const item of rejectedData) {
      if(newData.length < limit){
        newData.push(item)
      }
    }
  }

  return newData
}

const flatten = (ary) => {
  return ary.reduce((a, b) => {
    if (Array.isArray(b)) {
      return a.concat(flatten(b))
    }
    return a.concat(b)
  }, [])
}

const addImagePublisherMetadata = (imageURL, page, site, uid, userId, sessionId) => {
  
  return new Promise(async (resolve, reject) => {
   
    try {
      let publisher = await cache.getAsync(`${site}-publisher`)

      if(publisher){
        publisher = JSON.parse(publisher)
      } else {
        publisher = await getPublisher(checker)
        cache.setAsync(`${site}-publisher`, JSON.stringify(publisher)).then()
      }

      let img = await getImg(imageURL, page)

      if(!img){
        img = await addImg(dateFormat(new Date(), "yyyy-mm-dd HH:MM:ss"), imageURL, uid, page)
      }

      if(img && publisher && userId && sessionId){
        await createClientImgPublData(userId, sessionId, img.id, img.img, publisher.id)
      }
      
      resolve('success')
    } catch(err) {
        console.log(`Adding image publisher metadata failed for site ${site}`)
        console.log(err)
        reject(err)
    }
  })
}

const matchCategoryWithProductAliases = (category, productName) => {

  if(category && productName){
    productName = productName.replaceAll(' ', '_')
    let aliases = productAliases[productName.toLowerCase()]

    if(!aliases){
      aliases = [productName.toLowerCase()]
    }

    if(aliases){
      for (const product of shuffleArray(aliases)) {
        if(category.toLowerCase().includes(product.toLowerCase())){
          return true
        }
      }
    }
  }

  return false
}

const updateSessionData = (sessionId, duration) => {
  
  return new Promise(async (resolve, reject) => {
   
    try {
      if(sessionId){
        updateClientSessionData(sessionId, duration)
      }
      
      resolve('success')
    } catch(err) {
        console.log(`Updating duration for ${sessionId}`)
        console.log(err)
        
        reject(err)
    }
  })
}