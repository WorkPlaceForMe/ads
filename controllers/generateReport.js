const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const reportAff = require('../helper/reportAff')
const cache = require('../helper/cacheManager')
const conf = require('../middleware/prop')
const xlsx = require('node-xlsx').default
var stream = require('stream')

exports.generateReport = Controller(async (req, res) => {
  const responseData = {}
  const tableDataArray = []
  if (!req.query.init || !req.query.fin || !req.query.id || !req.query.option) {
    return res.status(400).json({
      success: false,
      message: 'Date range, id & option all is required',
    })
  }
  if (!['webpages', 'images'].includes(req.query.option)) {
    return res.status(400).json({
      success: false,
      message: 'Option must be webpages or images',
    })
  }
  try {
    getAllStats(req)
      .then(async (allStats) => {
        if (req.query.id !== 'all') {
          allStats = allStats.filter((item) => item.id == req.query.id)
        }
        if (allStats.length == 0) {
          return res
            .status(400)
            .json({ success: false, message: 'No Data Found' })
        }
        for (const stats of allStats) {
          req.query.url = stats.url
          responseData['stats'] = stats
          await getStatsUrl(req)
            .then(async (statsUrl) => {
              responseData['stats']['statsUrl'] = statsUrl
              for (
                let i = 0;
                i < responseData.stats.statsUrl.table.length;
                i++
              ) {
                req.query.imgs = responseData.stats.statsUrl.table[i].url
                await getStatsImg(req)
                  .then((images) => {
                    responseData.stats.statsUrl.table[i].images = images
                  })
                  .catch((err) => res.status(500).json(err))
              }

              for (const tData of responseData.stats.statsUrl.table) {
                tableDataArray.push(tData)
              }
            })
            .catch((err) => res.status(500).json(err))
        }

        const reportData = []
        if (req.query.option === 'webpages') {
          for (const webpage of tableDataArray) {
            delete webpage['images']
            reportData.push(webpage)
          }
        } else if (req.query.option === 'images') {
          for (const webpage of tableDataArray) {
            for (const image of webpage.images) {
              image['webPageBelongsTo'] = webpage.url
              reportData.push(image)
            }
          }
        }

        const data = await createExelReport(reportData)
        const filename = 'advanced_report_' + Date.now() + '.xlsx'
        const readStream = new stream.PassThrough()
        readStream.end(data)
        res.set('Content-disposition', 'attachment; filename=' + filename)
        res.set('Content-Type', 'text/plain')

        readStream.pipe(res)
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

const getAllStats = (req) => {
  return new Promise((resolve, reject) => {
    let ads = {},
      clicks = {},
      views = {},
      imgs = {},
      terminations = {},
      adsGrouped = {},
      clicksGrouped = {},
      viewsGrouped = {},
      imgsGrouped = {}
    getAdsPerPage(function (err, rows) {
      if (err) {
        return reject(err)
      } else {
        for (const stat of rows) {
          ads[stat.site] = stat.count
        }

        getImgPerPage(function (err, rows) {
          if (err) {
            return reject(err)
          } else {
            for (const stat of rows) {
              imgs[stat.site] = stat.count
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

                let table = []
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

                  const ids = await getPublisherId(Object.keys(imgsGrouped)[i])
                  if (ids.length == 0) {
                    ids[0] = {
                      enabled: false,
                      id: 0,
                    }
                  }

                  const init = new Date(req.query.init).toISOString()
                  const fin = new Date(req.query.fin).toISOString()
                  let rewards = {}
                  const cacheed = await cache.getAsync(
                    `${init}_${fin}_${ids[0].publisherId}`,
                  )

                  if (cacheed) {
                    rewards = cacheed
                  } else {
                    try {
                      rewards = await reportAff.report(
                        init,
                        fin,
                        ids[0].publisherId,
                      )
                      await cache.setAsync(
                        `${init}_${fin}_${ids[0].publisherId}`,
                        JSON.stringify(rewards),
                      )
                    } catch (err) {
                      rewards['totalReward'] = 0
                      rewards['totalConversionsCount'] = 0
                      await cache.setAsync(
                        `${init}_${fin}_${ids[0].publisherId}`,
                        JSON.stringify(rewards),
                      )
                    }
                  }

                  if (ids[0].enabled == 'true') {
                    ids[0].enabled = true
                  } else if (ids[0].enabled == 'false') {
                    ids[0].enabled = false
                  }

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
                    enabled: ids[0].enabled,
                    id: ids[0].id,
                    rewards: rewards['totalReward'],
                    conversions: rewards['totalConversionsCount'],
                  }
                }
                resolve(table)
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
          ads[stat.site] = stat.count
        }

        getImgPerPage(async function (err, rows) {
          if (err) {
            return reject(err)
          } else {
            for (const stat of rows) {
              imgs[stat.site] = stat.count
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
                  const def = 2
                  let adsPerImage, imgPerPage
                  if (ids[0].pages != null) {
                    const pages = JSON.parse(ids[0].pages)
                    if (pages[0][extension] != null) {
                      adsPerImage = pages[0][extension]
                    } else {
                      adsPerImage = def
                    }
                    if (pages[1][extension] != null) {
                      imgPerPage = pages[1][extension]
                    } else {
                      imgPerPage = imgsGrouped[Object.keys(imgsGrouped)[i]]
                    }
                  } else {
                    adsPerImage = def
                    imgPerPage = imgsGrouped[Object.keys(imgsGrouped)[i]]
                  }

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
                const cacheed = await cache.getAsync(
                  `${req.query.init}_${req.query.fin}_${ids[0].publisherId}`,
                )

                if (cacheed) {
                  return resolve({ table, rewards: JSON.parse(cacheed) })
                }
                try {
                  rewards = await reportAff.report(
                    req.query.init,
                    req.query.fin,
                    ids[0].publisherId,
                  )
                  await cache.setAsync(
                    `${req.query.init}_${req.query.fin}_${ids[0].publisherId}`,
                    JSON.stringify(rewards),
                  )
                } catch (err) {
                  rewards['totalReward'] = 0
                  rewards['totalConversionsCount'] = 0
                  await cache.setAsync(
                    `${req.query.init}_${req.query.fin}_${ids[0].publisherId}`,
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
              if (rows[i].idGeneration != rows[i + 1].idGeneration) {
                break
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
                  if (click == undefined) {
                    click = 0
                  }
                  let view = views[rows[i].img]
                  if (view == undefined) {
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
                  if (rows[i].idGeneration != rows[i + 1].idGeneration) {
                    break
                  }
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
    )}.adsPages where idGeneration = uid limit 1) as site FROM ${conf.get(
      'database',
    )}.adsPages group by idGeneration order by uid asc`,
    callback,
  )
}

function getImgPerPage(callback) {
  return db.query(
    `SELECT idGeneration as uid, count(*) as count, (select site from ${conf.get(
      'database',
    )}.imgsPages where idGeneration = uid limit 1) as site from ${conf.get(
      'database',
    )}.imgsPages group by idGeneration order by idGeneration asc;`,
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
    )}.imgsPages where site = '${site}' order by idGeneration desc;`,
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
    )}.adsPages where site = '${site}' order by idGeneration desc;`,
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
        }
        return resolve(elements)
      },
    )
  })
}
