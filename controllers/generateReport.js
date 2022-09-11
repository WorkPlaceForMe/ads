const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const reportAff = require('../helper/reportAff')
const cache = require('../helper/cacheManager')
const conf = require('../middleware/prop')
const xlsx = require('node-xlsx').default
var stream = require('stream')
const db1 = require('../campaigns-db/database')
const publishers = db1.publishers

exports.generateReport = Controller(async (req, res) => {
  const responseData = {}
  if (!req.query.init || !req.query.fin || !req.query.id || !req.query.option) {
    return res.status(400).json({
      success: false,
      message: 'Date range, id & option all is required',
    })
  }
  try {
    getStats(req)
      .then((stats) => {
        const statsLength = Object.keys(stats).length
        if (statsLength == 0) {
          return res.status(400).json({ success: false, message: 'Not Found' })
        }
        req.query.url = stats.url

        if(req.query.url && req.query.url.endsWith('/')){
           req.query.url = req.query.url.substring(0, req.query.url.length - 1)
        }

        if(req.query.url && req.query.url.includes('www.')){
           req.query.url = req.query.url.replace('www.', '')
        }

        responseData['stats'] = stats
        getStatsUrl(req)
          .then(async (statsUrl) => {
            responseData['stats']['statsUrl'] = statsUrl
            for (let i = 0; i < responseData.stats.statsUrl.table.length; i++) {
              req.query.imgs = responseData.stats.statsUrl.table[i].url

              if(req.query.imgs && req.query.imgs.includes('www.')){
                req.query.imgs = req.query.imgs.replace('www.', '')
              }

              if(req.query.option === 'images'){
                await getStatsImg(req)
                  .then((images) => {
                    responseData.stats.statsUrl.table[i].images = images
                  })
                  .catch((err) => {
                    console.log(err)
                    res.status(500).json(err)
                  })
              }

              if(req.query.option === 'categories'){
                await getStatsCategories(req)
                  .then((categories) => {
                    responseData.stats.statsUrl.table[i].categories = categories
                  })
                  .catch((err) => {
                    console.log(err)
                    res.status(500).json(err)
                  })
              }
            }

            let reportName = ''

            const webpageRes = [...responseData.stats.statsUrl.table]
            const reportData = []
            if (req.query.option === 'webpages') {
              reportName = 'Web Page Wise Report'

              for (const webpage of webpageRes) {
                delete webpage['images']
                webpage.totalReward = statsUrl.rewards.totalReward
                webpage.totalConversionsCount = statsUrl.rewards.totalConversionsCount

                if(webpage.url && !webpage.url.includes('/')){
                  webpage.url += '/'
                }

                reportData.push(webpage)
              }
            } else if (req.query.option === 'images') {
              reportName = 'Image Wise Report'

              for (const webpage of webpageRes) {
                for (const image of webpage.images) {
                  image['webPageBelongsTo'] = webpage.url
                  reportData.push(image)
                }
              }
            } else if (req.query.option === 'categories') {
              reportName = 'Category Wise Report'
              for (const webpage of webpageRes) {
                for (const category of webpage.categories) {
                  reportData.push(category)
                }
              }
            } else {
              return res.status(400).json({
                success: false,
                message: 'Option must be webpages or images',
              })
            }

            const data = createExelReport(reportData, reportName)
            const filename = reportName + '_' + Date.now() + '.xlsx'            
            
            res.attachment(filename)
            res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

            const readStream = new stream.PassThrough()
            readStream.end(data)

            readStream.pipe(res)
          })
          .catch((err) => {
            console.log(err)
            res.status(500).json(err)
          })
      })
  } catch (err) {
    console.log(err)
    res.status(500).json(err)
  }
})

const createExelReport = (data, reportName) => {
  const excelDataArray = []
  excelDataArray.push(getExcelColumnNames(Object.keys(data[0])))
  for (const obj of data) {
    excelDataArray.push(Object.values(obj))
  }
  const buffer = xlsx.build([{ name: reportName, data: excelDataArray }])

  return buffer
}

const getStats = (req) => {
  return new Promise((resolve, reject) => {
    let stats = {}
    let ads = {},
      clicks = {},
      views = {},
      imgs = {},
      terminations = {},
      adsGrouped = {},
      clicksGrouped = {},
      viewsGrouped = {},
      imgsGrouped = {}

    getAdsPerPage(async function (err, rows) {
      if (err) {
        return reject(err)
      } else {
        for (const stat of rows) {
          ads[stat.site] = (!ads[stat.site] ? 0 : ads[stat.site]) + stat.count
        }

        getImgPerPage(function (err, rows) {
          if (err) {
            return reject(err)
          } else {
            for (const stat of rows) {
              if(stat.site) {
                if(stat.site.includes('www.')){
                  stat.site = stat.site.replace('www.', '')
                }

                imgs[stat.site] = (!imgs[stat.site] ? 0 : imgs[stat.site]) + stat.count
              }
            }            

            getClicksAndViews(async function (err, rows) {
              if (err) {
                return reject(err)
              } else {
                for (const stat of rows) {
                  clicks[stat.url] = stat.clicks
                  views[stat.url] = stat.views
                }

                for (const click in clicks) {
                  let url = click.split('/')[2]
                  if(url.includes('www.')){
                    url = url.replace('www.', '')
                  }
                  if (url == '') {
                    url = 'Static File'
                  }
                  clicksGrouped[url] = (clicksGrouped[url] || 0) + clicks[click]
                }
                for (const view in views) {
                  let url = view.split('/')[2]
                  if(url.includes('www.')){
                    url = url.replace('www.', '')
                  }
                  if (url == '') {
                    url = 'Static File'
                  }
                  viewsGrouped[url] = (viewsGrouped[url] || 0) + views[view]
                }
                for (let img in imgs) {
                  if(img.includes('www.')){
                    img = img.replace('www.', '')
                  }

                  let url = img.split('/')[2]
                  let term = img.split('/')[0]
                  if (url == '') {
                    url = 'Static File'
                    term = ''
                  }
                  imgsGrouped[url] = (imgsGrouped[url] || 0) + imgs[img]
                  terminations[url] = term
                }
                for (let ad in ads) {
                  if(ad.includes('www.')){
                    ad = ad.replace('www.', '')
                  }
                  let url = ad.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  adsGrouped[url] = (adsGrouped[url] || 0) + ads[ad]
                }
                for (let i = 0; i < Object.keys(imgsGrouped).length; i++) {
                  if (!clicksGrouped[Object.keys(imgsGrouped)[i]]) {
                    clicksGrouped[Object.keys(imgsGrouped)[i]] = 0
                  }
                  if (!viewsGrouped[Object.keys(imgsGrouped)[i]]) {
                    viewsGrouped[Object.keys(imgsGrouped)[i]] = 0
                  }
                  if (
                    adsGrouped[Object.keys(imgsGrouped)[i]] == undefined ||
                    adsGrouped[Object.keys(imgsGrouped)[i]] == null
                  ) {
                    adsGrouped[Object.keys(imgsGrouped)[i]] = 0
                  }
                  let ctr =
                    Math.round(
                      (Math.round(
                        (clicksGrouped[Object.keys(imgsGrouped)[i]] /
                          imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                          100,
                      ) /
                        100 /
                        (Math.round(
                          (viewsGrouped[Object.keys(imgsGrouped)[i]] /
                            imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                            100,
                        ) /
                          100)) *
                        100,
                    ) / 100
                  if (Number.isNaN(ctr)) {
                    ctr = 0
                  }
                  let clicksPerImg =
                    Math.round(
                      (clicksGrouped[Object.keys(imgsGrouped)[i]] /
                        imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                        100,
                    ) / 100
                  if (Number.isNaN(clicksPerImg)) {
                    clicksPerImg = 0
                  }
                  let viewsPerImg =
                    Math.round(
                      (viewsGrouped[Object.keys(imgsGrouped)[i]] /
                        imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                        100,
                    ) / 100
                  if (Number.isNaN(viewsPerImg)) {
                    viewsPerImg = 0
                  }
                  let clicksPerAd =
                    Math.round(
                      (clicksGrouped[Object.keys(imgsGrouped)[i]] /
                        adsGrouped[Object.keys(imgsGrouped)[i]]) *
                        100,
                    ) / 100
                  if (Number.isNaN(clicksPerAd)) {
                    clicksPerAd = 0
                  }
                  let viewsPerAd =
                    Math.round(
                      (viewsGrouped[Object.keys(imgsGrouped)[i]] /
                        adsGrouped[Object.keys(imgsGrouped)[i]]) *
                        100,
                    ) / 100
                  if (Number.isNaN(viewsPerAd)) {
                    viewsPerAd = 0
                  }
                
                  let publisher = await cache.getAsync(`${Object.keys(imgsGrouped)[i]}-publisher`);

                  if(publisher){
                      publisher = JSON.parse(publisher);
                  } else {
                      publisher = await getPublisher(Object.keys(imgsGrouped)[i]);
                      cache.setAsync(`${Object.keys(imgsGrouped)[i]}-publisher`, JSON.stringify(publisher)).then();
                  }
                  
                  if (publisher && publisher.id === req.query.id) {
                    const init = new Date(req.query.init).toISOString()
                    const fin = new Date(req.query.fin).toISOString()
                    let rewards = {}
                    try {
                      rewards = await cache.getAsync(`${init}_${fin}_${publisher.publisherId}`)
                                        
                      if(rewards){
                          rewards = JSON.parse(rewards)
                      } else {
                          rewards = await reportAff.report(init, fin, publisher.publisherId)

                          if(rewards){
                              cache.setAsync(`${init}_${fin}_${publisher.publisherId}`, JSON.stringify(rewards)).then()
                          }
                      }
                    } catch (err) {
                      rewards['totalReward'] = 0
                      rewards['totalConversionsCount'] = 0
                    }

                    let siteURL = Object.keys(imgsGrouped)[i]

                    if(siteURL && !siteURL.includes('/')){
                      siteURL += '/'
                    }

                    if(siteURL && siteURL.includes('www.')){
                       siteURL = siteURL.replace('www.', '')
                    }

                    stats = {
                      url: siteURL,
                      clicksPerImg: clicksPerImg,
                      viewsPerImg: viewsPerImg,
                      clicksPerAd: clicksPerAd,
                      viewsPerAd: viewsPerAd,
                      ctr: ctr,
                      images: imgsGrouped[Object.keys(imgsGrouped)[i]],
                      ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                      clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],
                      views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                      enabled: publisher.enabled,
                      id: publisher.id,
                      rewards: rewards['totalReward'],
                      conversions: rewards['totalConversionsCount'],
                    }
                  }
                }

                resolve(stats)
              }
            })
          }
        })
      }
    })
  })
}

const getStatsUrl = (req) => {
  return new Promise((resolve, reject) => {
    const urlQuery = req.query.url

    let ads = {},
      clicks = {},
      views = {},
      imgs = {},
      adsGrouped = {},
      clicksGrouped = {},
      viewsGrouped = {},
      imgsGrouped = {}
    getAdsPerPage(async function (err, rows) {
      if (err) {
        return reject(err)
      } else {
        for (const stat of rows) {
          if(stat.site){
            if(stat.site.includes('www.')){
              stat.site = stat.site.replace('www.', '')
            }
            ads[stat.site] = (!ads[stat.site] ? 0 : ads[stat.site]) + stat.count
          }
        }

        getImgPerPage(async function (err, rows) {
          if (err) {
            return reject(err)
          } else {
            for (const stat of rows) {
              if(stat.site){
                if(stat.site.includes('www.')){
                  stat.site = stat.site.replace('www.', '')
                }
                imgs[stat.site] = (!imgs[stat.site] ? 0 : imgs[stat.site]) + stat.count
              }
            }

            getClicksAndViews(async function (err, rows) {
              if (err) {
                return reject(err)
              } else {
                for (const stat of rows) {
                  if(stat.url){
                    if(stat.url.includes('www.')){
                      stat.url = stat.url.replace('www.', '')
                    }

                    clicks[stat.url] = stat.clicks
                    views[stat.url] = stat.views
                  }
                }

                for (let click in clicks) {
                  if(click.includes('www.')){
                    click = click.replace('www.', '')
                  }
                  let url = click.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    clicksGrouped[click] =
                      (clicksGrouped[click] || 0) + clicks[click]
                  }
                }
                for (let view in views) {
                  if(view.includes('www.')){
                    view = view.replace('www.', '')
                  }
                  let url = view.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    viewsGrouped[view] = (viewsGrouped[view] || 0) + views[view]
                  }
                }
                for (let img in imgs) {
                  if(img.includes('www.')){
                    img = img.replace('www.', '')
                  }
                  let url = img.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    imgsGrouped[img] = (imgsGrouped[img] || 0) + imgs[img]
                  }
                }
                for (let ad in ads) {
                  if(ad.includes('www.')){
                    ad = ad.replace('www.', '')
                  }
                  let url = ad.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    adsGrouped[ad] = (adsGrouped[ad] || 0) + ads[ad]
                  }
                }

                let table = []
                let publisher = await cache.getAsync(`${req.query.url}-publisher`)

                if(publisher){
                    publisher = JSON.parse(publisher)
                } else {
                    publisher = await getPublisher(req.query.url)
                    cache.setAsync(`${req.query.url}-publisher`, JSON.stringify(publisher)).then()
                }

                getClientSessionDataByPublisherId(publisher.id, async function(err, rows){ 
                  for (let i = 0; i < Object.keys(imgsGrouped).length; i++) {
                    if (!clicksGrouped[Object.keys(imgsGrouped)[i]]) {
                      clicksGrouped[Object.keys(imgsGrouped)[i]] = 0
                    }
                    if (!viewsGrouped[Object.keys(imgsGrouped)[i]]) {
                      viewsGrouped[Object.keys(imgsGrouped)[i]] = 0
                    }
                    if (
                      adsGrouped[Object.keys(imgsGrouped)[i]] == undefined ||
                      adsGrouped[Object.keys(imgsGrouped)[i]] == null
                    ) {
                      adsGrouped[Object.keys(imgsGrouped)[i]] = 0
                    }
                    let ctr =
                      Math.round(
                        (Math.round(
                          (clicksGrouped[Object.keys(imgsGrouped)[i]] /
                            imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                            100,
                        ) /
                          100 /
                          (Math.round(
                            (viewsGrouped[Object.keys(imgsGrouped)[i]] /
                              imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                              100,
                          ) /
                            100)) *
                          100,
                      ) / 100
                    if (Number.isNaN(ctr)) {
                      ctr = 0
                    }
                    let clicksPerImg =
                      Math.round(
                        (clicksGrouped[Object.keys(imgsGrouped)[i]] /
                          imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                          100,
                      ) / 100
                    if (Number.isNaN(clicksPerImg)) {
                      clicksPerImg = 0
                    }
                    let viewsPerImg =
                      Math.round(
                        (viewsGrouped[Object.keys(imgsGrouped)[i]] /
                          imgsGrouped[Object.keys(imgsGrouped)[i]]) *
                          100,
                      ) / 100
                    if (Number.isNaN(viewsPerImg)) {
                      viewsPerImg = 0
                    }
                    let clicksPerAd =
                      Math.round(
                        (clicksGrouped[Object.keys(imgsGrouped)[i]] /
                          adsGrouped[Object.keys(imgsGrouped)[i]]) *
                          100,
                      ) / 100
                    if (Number.isNaN(clicksPerAd)) {
                      clicksPerAd = 0
                    }
                    let viewsPerAd =
                      Math.round(
                        (viewsGrouped[Object.keys(imgsGrouped)[i]] /
                          adsGrouped[Object.keys(imgsGrouped)[i]]) *
                          100,
                      ) / 100
                    if (Number.isNaN(viewsPerAd)) {
                      viewsPerAd = 0
                    }

                    if(req.query.url && req.query.url.includes('www.')){
                      req.query.url = req.query.url.replace('www.', '')
                    }

                    let extension = Object.keys(imgsGrouped)[i].split(
                      req.query.url,
                    )[1]
                  
                    let adsPerImage = publisher.adsperimage
                    let imgPerPage = imgsGrouped[Object.keys(imgsGrouped)[i]]

                    let siteURL = Object.keys(imgsGrouped)[i]

                    if(siteURL && !siteURL.includes('/')){
                        siteURL += '/'
                    }

                    if(siteURL && siteURL.includes('www.')){
                      siteURL = siteURL.replace('www.', '')
                    }

                    let userDuration = getUserDuration(rows, siteURL)

                    table[i] = {
                      url: siteURL,
                      clicksPerImg: clicksPerImg,
                      viewsPerImg: viewsPerImg,
                      clicksPerAd: clicksPerAd,
                      viewsPerAd: viewsPerAd,
                      ctr: ctr,
                      images: imgsGrouped[Object.keys(imgsGrouped)[i]],
                      ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                      clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],
                      views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                      adsperimage: adsPerImage,
                      imgNum: imgPerPage,
                      usercount: userDuration ? userDuration.usercount : 0, 
                      duration: userDuration ? Math.round((userDuration.duration/60.0)*100)/100 : 0.0
                    }
                  }

                  let rewards = {}
                  const init = new Date(req.query.init).toISOString()
                  const fin = new Date(req.query.fin).toISOString()
                  
                  try {
                    rewards = await cache.getAsync(`${init}_${fin}_${publisher.publisherId}`)
                                          
                    if(rewards){
                        rewards = JSON.parse(rewards)
                    } else {
                        rewards = await reportAff.report(init, fin, publisher.publisherId)

                        if(rewards){
                            cache.setAsync(`${init}_${fin}_${publisher.publisherId}`, JSON.stringify(rewards)).then()
                        }
                    }
                  } catch (err) {
                    rewards['totalReward'] = 0
                    rewards['totalConversionsCount'] = 0
                  }

                  resolve({ table, rewards })
                })
              }
            })
          }
        })
      }
    })
  })
}

const getStatsCategories = (req) => {
  return new Promise(async (resolve, reject) => {
    let urlQuery = req.query.imgs
    
    let categories = new Set(),
      clicks = {},
      views = {},
      ads = {},
      usercount = {},
      duration = {}

    let site = urlQuery
    let publisher = ''
    
    if (site.includes('www.')) {
      site = site.split('w.')[1]
    }

    if (site.includes('//')) {
      site = site.split('//')[1]
    }

    if (site.includes('/')) {
      site = site.split('/')[0]
    }

    if(site){
        publisher = await cache.getAsync(`${site}-publisher`);

        if(publisher){
            publisher = JSON.parse(publisher);
        } else {
            publisher = await getPublisher(site);
            cache.setAsync(`${site}-publisher`, JSON.stringify(publisher)).then();
        } 
    }

    getCategoryWiseData(publisher.id, function (err, rows) {
      if (err) {
        return reject(err)
      } else {
        const categoriesData = []

        for (const stat of rows) {
          let cat = stat['product_main_category_name']
          categories.add(cat)
          clicks[cat] = !clicks[cat] ? stat.clicks : (clicks[cat] + stat.clicks)
          views[cat] = !views[cat] ? stat.views : (views[cat] + stat.views)
          ads[cat] = !ads[cat] ? 1 : (ads[cat] + 1)

          if(!usercount[cat]){
            usercount[cat] = new Set()
          }
          usercount[cat] = usercount[cat].add(stat.clientId)
          duration[cat] = !duration[cat] ? stat.duration : (duration[cat] + stat.duration)
        }

        categories.forEach(category => {
          categoriesData.push({
            category: category,
            clicks: clicks[category],
            views: views[category],
            ads: ads[category],
            viewsPerAd: ads[category] == 0 ? 0.00 : Math.round((views[category]/ads[category])*100)/100,
            clicksPerAd: ads[category] == 0 ? 0.00 : Math.round((clicks[category]/ads[category])*100)/100,
            usercount: usercount[category].size,
            duration: Math.round((duration[category]/60.0)*100)/100                   
          })
        })
        
        resolve(categoriesData)
      }
    })
  })
}

const getStatsImg = (req) => {
  return new Promise(async (resolve, reject) => {
    let urlQuery = req.query.imgs
    
    let clicks = {},
      views = {}

    let site = urlQuery
    let publisher = ''
    
    if (site.includes('www.')) {
      site = site.split('w.')[1]
    }

    if (site.includes('//')) {
      site = site.split('//')[1]
    }

    if (site.includes('/')) {
      site = site.split('/')[0]
    }

    if(site){
        publisher = await cache.getAsync(`${site}-publisher`);

        if(publisher){
            publisher = JSON.parse(publisher);
        } else {
            publisher = await getPublisher(site);
            cache.setAsync(`${site}-publisher`, JSON.stringify(publisher)).then();
        } 
    }

    getClicksAndViewsPerImg(urlQuery, function (err, rows) {
      if (err) {
        return reject(err)
      } else {
        for (const stat of rows) {
          if(stat.img && stat.img.includes('www.')){
            stat.img = stat.img.replace('www.', '')
          }

          clicks[stat.img] = stat.clicks
          views[stat.img] = stat.views
        }
        getAdsListPerImg(urlQuery, function (err, rows) {
          if (err) {
            return reject(err)
          } else {
            let ads = {}
            
            for (let i = 0; i < rows.length; i++) {
              ads[rows[i].imgName] = (ads[rows[i].imgName] || 0) + 1
              if(i != rows.length - 1){
                if (rows[i].idGeneration != rows[i + 1].idGeneration) {
                  break
                }
              }

            }

            if(urlQuery && urlQuery.includes('//')){
              urlQuery = urlQuery.split('//')[1]
            }

            if(urlQuery && urlQuery.includes('www.')){
                urlQuery = urlQuery.replace('www.', '')
            }

            if(urlQuery && urlQuery.endsWith('/')){
              urlQuery = urlQuery.substring(0, urlQuery.length - 1)
            }

            if(urlQuery && urlQuery.includes('www.')){
                urlQuery = urlQuery.replace('www.', '')
            }

            getImgsList(urlQuery, publisher.id, function (err, rows) {
              if (err) {
                return reject(err)
              } else {
                let imgs = []
                for (let i = 0; i < rows.length; i++) {
                  let adsTotal = ads[rows[i].img]
                  if (adsTotal == undefined) {
                    adsTotal = 0
                  }
                  let click = clicks[rows[i].img]
                  if (!click) {
                    click = 0
                  }
                  
                  let view = views[rows[i].img]
                  if (!view) {
                    view = 0
                  }
                  
                  let ctr = Math.round((click / view) * 100) / 100
                  if (Number.isNaN(ctr)) {
                    ctr = 0
                  }
                  imgs.push({
                    img: rows[i].img,
                    title: rows[i].img.split('/')[
                      rows[i].img.split('/').length - 1
                    ],
                    clicks: click,
                    views: view,
                    ctr: ctr,
                    ads: adsTotal,
                    usercount: rows[i].usercount,
                    duration: Math.round((rows[i].duration/60.0)*100)/100                   
                  })
                }
                
                resolve(imgs)
              }
            })
          }
        })
      }
    })
  })
}

function getAdsPerPage(callback) {
  return db.query(
    `SELECT count(*) as count, idGeneration as uid, (select site from ${conf.get(
      'database',
    )}.adspages where idGeneration = uid limit 1) as site FROM ${conf.get(
      'database',
    )}.adspages group by idGeneration order by uid asc`,
    callback,
  )
}

function getImgPerPage(callback) {
  return db.query(
    `SELECT idGeneration as uid, count(*) as count, (select site from ${conf.get(
      'database',
    )}.imgspages where idGeneration = uid limit 1) as site from ${conf.get(
      'database',
    )}.imgspages group by idGeneration order by idGeneration asc;`,
    callback,
  )
}

function getClicksAndViews(callback) {
  return db.query(
    `SELECT url, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get(
      'database',
    )}.impressions group by url;`,
    callback,
  )
}

function getImgsList(site, publisherId, callback){   
  return db.query( `SELECT imguser.img, case when sum(duration) > 0 then count(*) else 0 END as usercount, sum(imguser.duration) as duration from
  (SELECT ipg.img, sum(duration) as duration FROM ${conf.get('database')}.imgspages ipg,  ${conf.get('database')}.clientimgpubl cipl  
  where publId = '${publisherId}' and cipl.imgUrl = ipg.img
  and ipg.site = 'https://${site}' OR ipg.site = 'https://www.${site}' OR ipg.site = 'http://${site}' OR ipg.site = 'http://www.${site}'
  group by cipl.clientId, ipg.img) imguser
  group by imguser.img`, callback)
}

function getClientSessionDataByPublisherId(publisherId, callback){   
  return db.query( `SELECT clientId, sum(duration) as duration, site FROM ${conf.get('database')}.clientsession
  where publId = '${publisherId}'
  group by clientId, site`, callback)
}

function getCategoryWiseData(publisherId, callback){   
  return db.query( `SELECT ctg.product_main_category_name, ctg.clientId, ctg.idItem, sum(ctg.clicks) as clicks, sum(ctg.views) as views, sum(ctg.duration) as duration
  FROM 
  (SELECT adpg.product_main_category_name, clip.idItem, clip.clientId, imps.clicks, imps.views, sum(clip.duration) as duration FROM ${conf.get('database')}.clientimgpubl clip, ${conf.get('database')}.adspages adpg, 
  (SELECT idItem, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) 
  AS views FROM ${conf.get('database')}.impressions imp group by imp.idItem) imps
  where clip.publId = '${publisherId}'
  and clip.idItem = adpg.id
  and imps.idItem = clip.idItem
  group by clip.idItem, clip.clientId) ctg
  group by ctg.product_main_category_name, ctg.idItem`, callback)
}

function getClicksAndViewsPerImg(site, callback) {
  return db.query(
    `SELECT img, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get(
      'database',
    )}.impressions where url = '${site}' group by img ;`,
    callback,
  )
}

function getAdsListPerImg(site, callback) {
  return db.query(
    `SELECT imgName, idGeneration FROM ${conf.get(
      'database',
    )}.adspages where site = '${site}' order by idGeneration desc;`,
    callback,
  )
}

function getPublisher(site) {
  return publishers.findOne({
    where: { name: site }
  });
}

function getUserDuration(rows, siteURL){
  const userDuration = { usercount: 0, duration: 0.0 }
  
  if(siteURL && rows && rows.length >0 ){
      for(let row of rows){
        if(siteURL == row.site){
            userDuration.usercount += 1
            userDuration.duration += row.duration
        }
    }
  }

  return userDuration
}

function getExcelColumnNames(columnKeys) {
  const columnNames = []

  columnKeys.forEach(columnKey => {
    const excelColumnName = excelColumnNames[columnKey]

    if(excelColumnName){
      columnNames.push(excelColumnName)
    } else {
      columnNames.push(columnKey)
    }    
  })

  return columnNames
}

const excelColumnNames = {
  ads: 'Total Number of Ads',
  adsperimage: 'Max Ads Per Image',
  clicks: 'Total Ad Clicks',  
  clicksPerAd: 'Average Clicks Per Ad',
  clicksPerImg: 'Average Clicks Per Image',
  ctr: 'CTR',
  imgNum: 'Total Images with Ads',
  totalConversionsCount: 'Total Ad Conversion Count',
  totalReward:  'Total Rewards',
  url: 'Web Page URL',
  views: 'Total Icon Impression',
  viewsPerAd: 'Average Views Per Ad',
  viewsPerImg: 'Average Views Per Image',
  usercount: 'Unique Visitors Count',
  duration: 'Total View Duration(In Min)',
  img: 'Image URL',
  title: 'Image Name',
  webPageBelongsTo: 'Web Page URL',
  category: 'Product Category'
}