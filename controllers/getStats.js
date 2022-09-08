const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const readCsv = require('./readCsv')
const reportAff = require('../helper/reportAff')
const auth = require('../helper/auth')
const cache = require('../helper/cacheManager')
const conf = require('../middleware/prop')
const db1 = require('../campaigns-db/database')
const publishers = db1.publishers

exports.getStats = Controller(async(req, res) => {
    let ads = {},
    clicks = {},
    views = {},
    imgs = {},
    terminations = {},
    adsGrouped = {},
    clicksGrouped = {},
    viewsGrouped = {},
    imgsGrouped = {}
    getAdsPerPage(function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            for(const stat of rows){
                if(stat.site){
                    if(stat.site.includes('www.')){
                        stat.site = stat.site.replace('www.', '')
                    }
                    
                    ads[stat.site] = (!ads[stat.site] ? 0 : ads[stat.site]) + stat.count
                }
            }
            getImgPerPage(function(err,rows){
                if(err){
                    res.status(500).json(err);
                    }
                else{
                    for(const stat of rows){
                        if(stat.site){
                            if(stat.site.includes('www.')){
                                stat.site = stat.site.replace('www.', '')
                            }
                            imgs[stat.site] = (!imgs[stat.site] ? 0 : imgs[stat.site]) + stat.count
                        }
                    }
                    getClicksAndViews(async function(err,rows){
                        if(err){
                            res.status(500).json(err);
                            }
                        else{
                            for(let stat of rows){
                                if(stat.url){
                                    stat.url = decodeURI(stat.url)
                                }
                                if(stat.url && stat.url.includes('www.')){
                                    stat.url = stat.url.replace('www.', '')
                                }

                                clicks[stat.url] = stat.clicks
                                views[stat.url] = stat.views
                            }
                            for(const click in clicks){
                                let url = click.split('/')[2]
                                if(url == ''){
                                    url = 'Static File'
                                }
                                clicksGrouped[url] = (clicksGrouped[url]  || 0) + clicks[click]
                            }
                            for(const view in views){
                                let url = view.split('/')[2]
                                if(url == ''){
                                    url = 'Static File'
                                }
                                viewsGrouped[url] = (viewsGrouped[url]  || 0) + views[view]
                            }
                            for(let img in imgs){
                                let url = img.split('/')[2]
                                let term = img.split('/')[0]
                                if(url == ''){
                                    url = 'Static File'
                                    term = ''
                                }
                                imgsGrouped[url] = (imgsGrouped[url]  || 0) + imgs[img]
                                terminations[url] = term
                            }
                            for(let ad in ads){
                                let url = ad.split('/')[2]
                                if(url == ''){
                                    url = 'Static File'
                                }
                                adsGrouped[url] = (adsGrouped[url]  || 0) + ads[ad]
                            }

                            let table = []
                            const publ = await getPublsh()
                            for(const pub of publ){
                                if(imgsGrouped[pub.dataValues.name] ===  undefined){
                                    imgsGrouped[pub.dataValues.name] = 0
                                    clicksGrouped[pub.dataValues.name] = 0
                                    adsGrouped[pub.dataValues.name] = 0
                                    viewsGrouped[pub.dataValues.name] = 0
                                }
                            }
                            for(let i = 0; i < Object.keys(imgsGrouped).length; i++){
                                if(publ.length != Object.keys(imgsGrouped).length){
                                    let count = 0;
                                    for(const pub of publ){
                                        if(pub.dataValues.name != Object.keys(imgsGrouped)[i]){
                                            count ++;
                                        }
                                    }
                                    if(count == Object.keys(imgsGrouped).length -1){
                                        continue;
                                    }
                                }
                                if(!clicksGrouped[Object.keys(imgsGrouped)[i]]){
                                    clicksGrouped[Object.keys(imgsGrouped)[i]] = 0
                                }
                                if(!viewsGrouped[Object.keys(imgsGrouped)[i]]){
                                    viewsGrouped[Object.keys(imgsGrouped)[i]] = 0
                                }
                                if(adsGrouped[Object.keys(imgsGrouped)[i]] == undefined || adsGrouped[Object.keys(imgsGrouped)[i]] == null){
                                    adsGrouped[Object.keys(imgsGrouped)[i]] = 0;
                                }
                                let ctr = Math.round(((Math.round((clicksGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100) / (Math.round((viewsGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100)) * 100) / 100;
                                if(Number.isNaN(ctr)){
                                    ctr = 0;
                                }
                                let clicksPerImg = Math.round((clicksGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(clicksPerImg)){
                                    clicksPerImg = 0;
                                }
                                let viewsPerImg = Math.round((viewsGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(viewsPerImg)){
                                    viewsPerImg = 0;
                                }
                                let clicksPerAd = Math.round((clicksGrouped[Object.keys(imgsGrouped)[i]] / adsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(clicksPerAd)){
                                    clicksPerAd = 0;
                                }
                                let viewsPerAd = Math.round((viewsGrouped[Object.keys(imgsGrouped)[i]] / adsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(viewsPerAd)){
                                    viewsPerAd = 0;
                                }

                                const ids = await getPublisherId(Object.keys(imgsGrouped)[i])
                                if(ids.length == 0){
                                    ids[0] = {
                                        enabled: false,
                                        id: 0
                                    }
                                }

                                const init = new Date(req.query.init).toISOString()
                                const fin = new Date(req.query.fin).toISOString()
                                let rewards = {};
                            
                                try{
                                    if(ids[0].publisherId){
                                        rewards = await cache.getAsync(`${init}_${fin}_${ids[0].publisherId}`)
                                        
                                        if(rewards){
                                            rewards = JSON.parse(rewards)
                                        } else {
                                            rewards = await reportAff.report(init,fin,ids[0].publisherId)

                                            if(rewards){
                                                cache.setAsync(`${init}_${fin}_${ids[0].publisherId}`, JSON.stringify(rewards)).then()
                                            }
                                        }
                                    } else{
                                        rewards['totalReward'] = 0
                                        rewards['totalConversionsCount'] = 0
                                    }
                                }catch(err){
                                    rewards['totalReward'] = 0;
                                    rewards['totalConversionsCount'] = 0
                                }

                                if(ids[0].enabled == 'true'){
                                        ids[0].enabled  = true
                                    }else if(ids[0].enabled == 'false'){
                                        ids[0].enabled  = false
                                    }

                                    let siteURL = Object.keys(imgsGrouped)[i]
                
                                    if(siteURL && siteURL.includes('www.')){
                                       siteURL = siteURL.replace('www.', '')
                                    }                

                                    table[i] = {
                                        url : siteURL,
                                        clicksPerImg: clicksPerImg,
                                        viewsPerImg : viewsPerImg,
                                        clicksPerAd: clicksPerAd,
                                        viewsPerAd : viewsPerAd,
                                        ctr: ctr,
                                        images: imgsGrouped[Object.keys(imgsGrouped)[i]],
                                        ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                                        clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],
                                        views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                                        enabled: ids[0].enabled,
                                        id: ids[0].id,
                                        rewards: rewards['totalReward'],
                                        conversions: rewards['totalConversionsCount'],
                                        nickname: ids[0].nickname || siteURL
                                    }

                            }
                            let filtered = table.filter(function (el) {
                                return el != null;
                            });
                            res.status(200).json({success: true, table: filtered});
                        }
                    })
                }
            })
        }
    })
})

exports.getStatsUrl = Controller(async(req, res) => {
    const urlQuery = req.query.url
    // console.log(urlQuery)
    let ads = {},
    imagesWithAds = {},
    clicks = {},
    views = {},
    imgs = {},
    adsGrouped = {},
    clicksGrouped = {},
    viewsGrouped = {},
    imgsGrouped = {}
    getAdsPerPage(async function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            for(const stat of rows){
                let name = ''
                if(stat.site){
                    if(stat.site.includes('//')){
                        name = stat.site.split('//')[1]
                    } else {
                        name = stat.site
                    } 
                    
                    if(name && name.startsWith('www.')){
                        name = name.replace('www.', '')
                    }
                }
                
                if(name){
                    ads[name] = (!ads[name] ? 0 : ads[name]) + stat.count
                    imagesWithAds[name] = (!imagesWithAds[name] ? 0 : imagesWithAds[name]) + 1
                }
            }
            // console.table(ads)
            getImgPerPage(async function(err,rows){
                if(err){
                    res.status(500).json(err);
                    }
                else{
                    for(const stat of rows){                       
                        let name = ''
                        if(stat.site){
                            if(stat.site.includes('//')){
                                name = stat.site.split('//')[1]
                            } else {
                                name = stat.site
                            }
                            
                            if(name && name.startsWith('www.')){
                                name = name.replace('www.', '')
                            }
                        }
                        
                        if(name){
                            imgs[name] = (!imgs[name] ? 0 : imgs[name]) + stat.count
                        }
                    }
                    //console.table(imgs)
                    getClicksAndViews(async function(err,rows){
                        if(err){
                            res.status(500).json(err);
                            }
                        else{
                            for(const stat of rows){
                                if(stat.url){
                                    let name = decodeURI(stat.url)
                                    if(name.includes('//')){
                                        name = name.split('//')[1]
                                    }
                                    if(name && name.startsWith('www.')){
                                        name = name.replace('www.', '')
                                    }
                                    clicks[name] = stat.clicks
                                    views[name] = stat.views
                                }
                            }
                          
                            for(const click in clicks){
                                let url = click.split('/')[0]

                                if(url && url.includes('www.')){
                                    url = url.replace('www.', '')
                                }

                                if(url == ''){
                                    url = 'Static File'
                                }
                                if(url == urlQuery){
                                    clicksGrouped[click] = (clicksGrouped[click]  || 0) + clicks[click]
                                }
                            }
                            for(const view in views){
                                let url = view.split('/')[0]
                                if(url == ''){
                                    url = 'Static File'
                                }
                                if(url == urlQuery){
                                    viewsGrouped[view] = (viewsGrouped[view]  || 0) + views[view]
                                }
                            }
                            for(const img in imgs){
                                let url = img.split('/')[0]

                                if(url && url.includes('www.')){
                                    url = url.replace('www.', '')
                                }

                                if(url == ''){
                                    url = 'Static File'
                                }
                                if(url == urlQuery){         
                                    imgsGrouped[img] = (imgsGrouped[img]  || 0) + imgs[img]
                                }
                            }
                            for(const ad in ads){
                                let url = ad.split('/')[0]

                                if(url && url.includes('www.')){
                                    url = url.replace('www.', '')
                                }

                                if(url == ''){
                                    url = 'Static File'
                                }
                                if(url == urlQuery){         
                                    adsGrouped[ad] = (adsGrouped[ad]  || 0) + ads[ad]
                                }
                            }
                          
                            let table = []
                            const ids = await getPublisherId(req.query.url)
                            for(let i = 0; i < Object.keys(imgsGrouped).length; i++){
                                if(!clicksGrouped[Object.keys(imgsGrouped)[i]]){
                                    clicksGrouped[Object.keys(imgsGrouped)[i]] = 0
                                }
                                if(!viewsGrouped[Object.keys(imgsGrouped)[i]]){
                                    viewsGrouped[Object.keys(imgsGrouped)[i]] = 0
                                }
                                if(adsGrouped[Object.keys(imgsGrouped)[i]] == undefined || adsGrouped[Object.keys(imgsGrouped)[i]] == null){
                                    adsGrouped[Object.keys(imgsGrouped)[i]] = 0;
                                }
                                let ctr = Math.round(((Math.round((clicksGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100) / (Math.round((viewsGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100)) * 100) / 100;
                                if(Number.isNaN(ctr)){
                                    ctr = 0;
                                }
                                let clicksPerImg = Math.round((clicksGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(clicksPerImg)){
                                    clicksPerImg = 0;
                                }
                                let viewsPerImg = Math.round((viewsGrouped[Object.keys(imgsGrouped)[i]] / imgsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(viewsPerImg)){
                                    viewsPerImg = 0;
                                }
                                let clicksPerAd = Math.round((clicksGrouped[Object.keys(imgsGrouped)[i]] / adsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(clicksPerAd)){
                                    clicksPerAd = 0;
                                }
                                let viewsPerAd = Math.round((viewsGrouped[Object.keys(imgsGrouped)[i]] / adsGrouped[Object.keys(imgsGrouped)[i]]) * 100) / 100;
                                if(Number.isNaN(viewsPerAd)){
                                    viewsPerAd = 0;
                                }

                                let extension = Object.keys(imgsGrouped)[i].split(req.query.url)[1]
                                const def = conf.get('max_ads_per_image') || 4                               
                                let adsPerImage = def
                                let imgPerPage = imagesWithAds[Object.keys(imgsGrouped)[i]]
                                let totImgs = imgsGrouped[Object.keys(imgsGrouped)[i]]

                                let siteURL = Object.keys(imgsGrouped)[i]

                                if(siteURL && !siteURL.includes('/')){
                                    siteURL += '/'
                                }

                                if(siteURL && siteURL.includes('www.')){
                                    siteURL = siteURL.replace('www.', '')
                                }

                                table[i] = {
                                    url : siteURL,
                                    clicksPerImg: clicksPerImg,
                                    viewsPerImg : viewsPerImg,
                                    clicksPerAd: clicksPerAd,
                                    viewsPerAd : viewsPerAd,
                                    ctr: ctr,
                                    images: imgsGrouped[Object.keys(imgsGrouped)[i]],
                                    ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                                    clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],
                                    views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                                    adsNum: adsPerImage,
                                    imgNum: imgPerPage || 0,
                                    totImgs: totImgs
                                }
                            }
                            
                            if(table.length == 0){
                                table.push({"url":"/","clicksPerImg":0,"viewsPerImg":0,"clicksPerAd":0,"viewsPerAd":0,"ctr":0,"images":0,"ads":0,"clicks":0,"views":0,"adsNum":0,"imgNum":0,"totImgs":0})
                            }
                            
                            let rewards = {};
                            const init = new Date(req.query.init).toISOString();
                            const fin = new Date(req.query.fin).toISOString();
                            
                            try{                              
                                rewards = await cache.getAsync(`${init}_${fin}_${ids[0].publisherId}`)
                                        
                                if(rewards){
                                    rewards = JSON.parse(rewards)
                                } else {
                                    rewards = await reportAff.report(init,fin,ids[0].publisherId)

                                    if(rewards){
                                        cache.setAsync(`${init}_${fin}_${ids[0].publisherId}`, JSON.stringify(rewards)).then()
                                    }
                                }
                            } catch(err){
                                rewards['totalReward'] = 0
                                rewards['totalConversionsCount'] = 0
                            }

                            res.status(200).json({success: true, table: table, rewards: rewards});
                        }
                    })
                }
            })
        }
    })
})

exports.getStatsImg = Controller(async(req, res) => {
    let urlQuery = req.query.imgs

    if(urlQuery && urlQuery.endsWith('/')){
        urlQuery = urlQuery.substring(0, urlQuery.length - 1)
    }

    if(urlQuery && urlQuery.includes('www.')){
        urlQuery = urlQuery.replace('www.', '')
      }

    let clicks = {},
    views = {}
    getClicksAndViewsPerImg(urlQuery,function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            for(const stat of rows){
                if(stat.img){
                    let name = decodeURI(stat.img)

                    if(name.includes('//')){
                        name = name.split('//')[1]
                    }

                    if(name.startsWith('www.')){
                        name = name.replace('www.', '')
                    }                   

                    if(name){
                        clicks[name] = (clicks[name]  || 0) + stat.clicks
                        views[name] = (views[name]  || 0) + stat.views
                    }
                }
                
            }
            getAdsListPerImg(urlQuery,function(err,rows){
                if(err){
                    res.status(500).json(err);
                    }
                else{
                    let ads = {}
                    for(let i = 0; i<rows.length; i++){
                        let img = decodeURI(rows[i].imgName)

                        if(img){
                            if(img.includes('//')){
                                img = img.split('//')[1]
                            }

                            if(img && img.startsWith('www.')){
                                img = img.replace('www.', '')
                            }

                            ads[img] = (ads[img]  || 0) + 1
                        }
                    }
                    getImgsList(urlQuery,function(err,rows){
                        if(err){
                            res.status(500).json(err);
                            }
                        else{
                            let imgs = []
                            for(let i = 0; i<rows.length; i++){
                                let img = decodeURI(rows[i].img)

                                if(img.includes('//')){
                                   img = img.split('//')[1]
                                }

                                if(img && img.startsWith('www.')){
                                    img = img.replace('www.', '')
                                }

                                let adsTotal = ads[img]
                                if(!adsTotal){
                                    adsTotal = 0
                                }
                                let click = clicks[img]
                                
                                if(!click){
                                    click = 0
                                }
                                
                                let view = views[img]
                                if(!view){
                                    view = 0
                                }
                                let ctr = Math.round((click / view) * 100) / 100
                                if(Number.isNaN(ctr)){
                                    ctr = 0
                                }
                                imgs.push({img: rows[i].img, title: rows[i].img.split('/')[rows[i].img.split('/').length - 1],clicks : click, views: view, ctr: ctr, ads: adsTotal})
                    
                            }
                            res.status(200).json({success: true, table: imgs});
                        }
                    })
                }
            })
        }
    })
})

exports.getStatsAd = (req) => {
    return new Promise((resolve, reject) => {
        const urlQuery = req.query
        let clicks = {},
        views = {},
        ads = []
        getAdsClicksAndViews(urlQuery.ad,urlQuery.url,async function(err,rows){
            if(err){
                reject(err);
            } else{
                for(const stat of rows){
                    clicks[stat.idItem] = stat.clicks
                    views[stat.idItem] = stat.views
                }
                
                getAdsList(urlQuery.ad,urlQuery.url,async function(err,rows){
                    if(err){
                        reject(err);
                    } else {
                        for(let i = 0; i<rows.length; i++){                    
                        let click = clicks[rows[i].idItem]
                                    
                            if(!click){
                                click = 0
                            }
                            
                            let view = views[rows[i].idItem]
                            
                            if(!view){
                                view = 0
                            }
                            let ctr = Math.round((click / view) * 100) / 100
                            
                            if(Number.isNaN(ctr)){
                                ctr = 0
                            }

                            ads.push({
                                img: rows[i].imgName,
                                title: rows[i].imgName.split('/')[
                                rows[i].imgName.split('/').length - 1
                                ],
                                clicks: click,
                                views: view,
                                ctr: ctr
                            })
                        }

                        resolve({table: ads})
                    }
                })
            }
        })
    })
}

function getAdsPerPage(callback){
    return db.query(`SELECT count(*) as count, site, imgName FROM ${conf.get('database')}.adspages group by site, imgName order by site asc;`, callback)
}

function getImgPerPage(callback){
    return db.query(`SELECT idGeneration as uid, count(*) as count, (select site from ${conf.get('database')}.imgspages where idGeneration = uid limit 1) as site from ${conf.get('database')}.imgspages group by idGeneration order by idGeneration asc;`,callback)
}

function getClicksAndViews(callback){
    return db.query(`SELECT url, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get('database')}.impressions group by url;`,callback)
}

function getImgsList(site,callback){
    return db.query(`SELECT img, idGeneration FROM ${conf.get('database')}.imgspages where site = 'https://${site}' OR site = 'https://www.${site}' OR site = 'http://${site}' OR site = 'http://www.${site}' order by idGeneration desc;`,callback)
}

function getClicksAndViewsPerImg(site,callback){
    site = encodeURI(site)
    return db.query(`SELECT img, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get('database')}.impressions where url = 'https://${site}' OR url = 'https://www.${site}' OR url = 'http://${site}' OR url = 'http://www.${site}' group by img;`,callback)
}

function getAdsListPerImg(site,callback){
    return db.query(`SELECT imgName, idGeneration FROM ${conf.get('database')}.adspages where site = 'https://${site}' OR site = 'https://www.${site}' OR site = 'http://${site}' OR site = 'http://www.${site}' order by idGeneration desc;`,callback)
}

function getAdsList(img,site,callback){
    return db.query(`SELECT imgName, idGeneration,idItem FROM ${conf.get('database')}.adspages where (site = 'https://${site}' OR site = 'https://www.${site}' OR site = 'http://${site}' OR site = 'http://www.${site}') and imgName='${img}' order by idGeneration desc;`,callback)
}

function getAdsClicksAndViews(img,site,callback){
    site = encodeURI(site)
    return db.query(`SELECT idItem,img, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get('database')}.impressions where ( url = 'https://${site}' OR url = 'https://www.${site}' OR url = 'http://${site}' OR url = 'http://www.${site}' ) and img= '${img}' group by idItem;`,callback)
}

const getPublisherId = async function(site){
    return new Promise(function(resolve, reject){
        db.query(`SELECT * from publishers where name ='${site}';`,  (error, elements)=>{
                if(error){
                    return reject(error);
                }
                return resolve(elements);
            });
    });
}

const getPublsh = async function(){
    const publ = await publishers.findAll()
    return publ
}