const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const reportAff = require('../helper/reportAff')
const cache = require('../helper/cacheManager')
const conf = require('../middleware/prop')
const xlsx = require('node-xlsx').default
var stream = require('stream')

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
        responseData['stats'] = stats
        getStatsUrl(req)
          .then(async (statsUrl) => {
            responseData['stats']['statsUrl'] = statsUrl
            for (let i = 0; i < responseData.stats.statsUrl.table.length; i++) {
              req.query.imgs = responseData.stats.statsUrl.table[i].url
              await getStatsImg(req)
                .then((images) => {
                  responseData.stats.statsUrl.table[i].images = images
                })
                .catch((err) => res.status(500).json(err))
            }

            const webpageRes = [...responseData.stats.statsUrl.table]
            const reportData = []
            if (req.query.option === 'webpages') {
              for (const webpage of webpageRes) {
                delete webpage['images']
                webpage.totalReward = statsUrl.rewards.totalReward
                webpage.totalConversionsCount = statsUrl.rewards.totalConversionsCount
                reportData.push(webpage)
              }
            } else if (req.query.option === 'images') {
              for (const webpage of webpageRes) {
                for (const image of webpage.images) {
                  image['webPageBelongsTo'] = webpage.url
                  reportData.push(image)
                }
              }
            } else {
              return res.status(400).json({
                success: false,
                message: 'Option must be webpages or images',
              })
              // res.status(200).json(responseData)
            }

            const data = await createExelReport(reportData)
            const filename = 'advanced_report_' + Date.now() + '.xlsx'
            const readStream = new stream.PassThrough()
            readStream.end(data)
            res.set('Content-disposition', 'attachment; filename=' + filename)
            res.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')

            readStream.pipe(res)
          })
          .catch((err) => res.status(500).json(err))
      })
      .catch((err) => res.status(500).json(err))
  } catch (err) {
    res.status(500).json(err)
  }
})

const createExelReport = (data) => {
  const excelDataArray = []
  excelDataArray.push(Object.keys(data[0]))
  for (const obj of data) {
    excelDataArray.push(Object.values(obj))
  }
  const buffer = xlsx.build([{ name: 'AdvancedReport', data: excelDataArray }])

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
              imgs[stat.site] = (!imgs[stat.site] ? 0 : imgs[stat.site]) + stat.count
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
                  if (url == '') {
                    url = 'Static File'
                  }
                  clicksGrouped[url] = (clicksGrouped[url] || 0) + clicks[click]
                }
                for (const view in views) {
                  let url = view.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  viewsGrouped[url] = (viewsGrouped[url] || 0) + views[view]
                }
                for (const img in imgs) {
                  let url = img.split('/')[2]
                  let term = img.split('/')[0]
                  if (url == '') {
                    url = 'Static File'
                    term = ''
                  }
                  imgsGrouped[url] = (imgsGrouped[url] || 0) + imgs[img]
                  terminations[url] = term
                }
                for (const ad in ads) {
                  let url = ad.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  adsGrouped[url] = (adsGrouped[url] || 0) + ads[ad]
                }
                for (let i = 0; i < Object.keys(imgsGrouped).length; i++) {
                  // let count = 0;
                  // for(const pub of publ){
                  //     if(pub.dataValues.name != Object.keys(imgsGrouped)[i]){
                  //         count ++;
                  //     }
                  // }
                  // console.log(count, Object.keys(imgsGrouped).length)
                  // if(count == Object.keys(imgsGrouped).length -1){
                  //     continue;
                  // }
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

                  const ids = await getPublisherId(Object.keys(imgsGrouped)[i])
                  if(ids.length == 0){
                    continue;
                  }
                  if (ids[0].id === req.query.id) {
                    const init = new Date(req.query.init).toISOString()
                    const fin = new Date(req.query.fin).toISOString()
                    let rewards = {}
                    try {
                      rewards = await reportAff.report(
                        init,
                        fin,
                        ids[0].publisherId,
                      )
                    } catch (err) {
                      rewards['totalReward'] = 0
                      rewards['totalConversionsCount'] = 0
                    }

                    if (ids[0].enabled == 'true') {
                      ids[0].enabled = true
                    } else if (ids[0].enabled == 'false') {
                      ids[0].enabled = false
                    }

                    stats = {
                      url: Object.keys(imgsGrouped)[i],
                      clicksPerImg: clicksPerImg,
                      viewsPerImg: viewsPerImg,
                      clicksPerAd: clicksPerAd,
                      viewsPerAd: viewsPerAd,
                      ctr: ctr,
                      images: imgsGrouped[Object.keys(imgsGrouped)[i]],
                      ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                      clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],
                      views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                      enabled: ids[0].enabled,
                      id: ids[0].id,
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
          ads[stat.site] = (!ads[stat.site] ? 0 : ads[stat.site]) + stat.count
        }

        getImgPerPage(async function (err, rows) {
          if (err) {
            return reject(err)
          } else {
            for (const stat of rows) {
              imgs[stat.site] = (!imgs[stat.site] ? 0 : imgs[stat.site]) + stat.count
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
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    clicksGrouped[click] =
                      (clicksGrouped[click] || 0) + clicks[click]
                  }
                }
                for (const view in views) {
                  let url = view.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    viewsGrouped[view] = (viewsGrouped[view] || 0) + views[view]
                  }
                }
                for (const img in imgs) {
                  let url = img.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    imgsGrouped[img] = (imgsGrouped[img] || 0) + imgs[img]
                  }
                }
                for (const ad in ads) {
                  let url = ad.split('/')[2]
                  if (url == '') {
                    url = 'Static File'
                  }
                  if (url == urlQuery) {
                    adsGrouped[ad] = (adsGrouped[ad] || 0) + ads[ad]
                  }
                }

                let table = []
                const ids = await getPublisherId(req.query.url)
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

                  let extension = Object.keys(imgsGrouped)[i].split(
                    req.query.url,
                  )[1]
                  const def = conf.get('max_ads_per_image') || 4
                
                  let adsPerImage = def
                  let imgPerPage = imgsGrouped[Object.keys(imgsGrouped)[i]]

                  table[i] = {
                    url: Object.keys(imgsGrouped)[i],
                    clicksPerImg: clicksPerImg,
                    viewsPerImg: viewsPerImg,
                    clicksPerAd: clicksPerAd,
                    viewsPerAd: viewsPerAd,
                    ctr: ctr,
                    images: imgsGrouped[Object.keys(imgsGrouped)[i]],
                    ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                    clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],
                    views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                    adsNum: adsPerImage,
                    imgNum: imgPerPage,
                  }
                }

                let rewards = {}
                const init = new Date(req.query.init).toISOString()
                const fin = new Date(req.query.fin).toISOString()
                const cacheed = await cache.getAsync(
                  `${init}_${fin}_${ids[0].publisherId}`,
                )

                if (cacheed) {
                  return resolve({ table, rewards: JSON.parse(cacheed) })
                }
                try {
                  rewards = await reportAff.report(
                    init,
                    fin,
                    ids[0].publisherId,
                  )
                } catch (err) {
                  rewards['totalReward'] = 0
                  rewards['totalConversionsCount'] = 0
                  cache.setAsync(
                    `${init}_${fin}_${ids[0].publisherId}`,
                    JSON.stringify(rewards),
                  )
                }

                resolve({ table, rewards })
              }
            })
          }
        })
      }
    })
  })
}

const getStatsImg = (req) => {
  return new Promise((resolve, reject) => {
    const urlQuery = req.query.imgs
    let clicks = {},
      views = {}
    getClicksAndViewsPerImg(urlQuery, function (err, rows) {
      if (err) {
        return reject(err)
      } else {
        for (const stat of rows) {
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
            getImgsList(urlQuery, function (err, rows) {
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

function getImgsList(site, callback) {
  return db.query(
    `SELECT img, idGeneration FROM ${conf.get(
      'database',
    )}.imgspages where site = '${site}' order by idGeneration desc;`,
    callback,
  )
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

const getPublisherId = async function (site) {
  return new Promise(function (resolve, reject) {
    db.query(
      `SELECT * from publishers where name ='${site}';`,
      (error, elements) => {
        if (error) {
          return reject(error)
          console.log(error)
        }
        return resolve(elements)
      },
    )
  })
}