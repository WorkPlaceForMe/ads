const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const reportAff = require('../helper/reportAff')
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
                                if(!imgsGrouped[pub.dataValues.name]){
                                    imgsGrouped[pub.dataValues.name] = 0
                                    clicksGrouped[pub.dataValues.name] = 0
                                    adsGrouped[pub.dataValues.name] = 0
                                    viewsGrouped[pub.dataValues.name] = 0
                                }
                            }

                            getAllClientSessionData(async function(err, rows){
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

                                    let publisher = await cache.getAsync(`${Object.keys(imgsGrouped)[i]}-publisher`);

                                    if(publisher){
                                        publisher = JSON.parse(publisher);
                                    } else {
                                        publisher = await getPublisher(Object.keys(imgsGrouped)[i]);
                                        cache.setAsync(`${Object.keys(imgsGrouped)[i]}-publisher`, JSON.stringify(publisher)).then();
                                    } 

                                    const init = new Date(req.query.init).toISOString()
                                    const fin = new Date(req.query.fin).toISOString()
                                    let rewards = {};
                                
                                    try{
                                        if(publisher.publisherId){
                                            rewards = await cache.getAsync(`${init}_${fin}_${publisher.publisherId}`)
                                            
                                            if(rewards){
                                                rewards = JSON.parse(rewards)
                                            } else {
                                                rewards = await reportAff.report(init, fin, publisher.publisherId)

                                                if(rewards){
                                                    cache.setAsync(`${init}_${fin}_${publisher.publisherId}`, JSON.stringify(rewards)).then()
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

                                    let siteURL = Object.keys(imgsGrouped)[i]
                
                                    if(siteURL && siteURL.includes('www.')){
                                        siteURL = siteURL.replace('www.', '')
                                    }
                                    
                                    let userDuration = getUserDuration(rows, publisher.id, null)

                                    table[i] = {
                                        url : siteURL,
                                        ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                                        views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                                        clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],                                        
                                        ctr: ctr,
                                        clicksPerImg: clicksPerImg,
                                        viewsPerImg : viewsPerImg,
                                        clicksPerAd: clicksPerAd,
                                        viewsPerAd : viewsPerAd,                                       
                                        images: imgsGrouped[Object.keys(imgsGrouped)[i]],                                       
                                        enabled: publisher.enabled,
                                        id: publisher.id,
                                        rewards: rewards['totalReward'],
                                        conversions: rewards['totalConversionsCount'],
                                        nickname: publisher.nickname || siteURL,
                                        adsperimage: publisher.adsperimage,
                                        usercount: userDuration ? userDuration.usercount : 0, 
                                        duration: userDuration ? Math.round((userDuration.duration/60.0)*100)/100 : 0.0
                                    }

                                }
                                
                                let filtered = table.filter(function (el) {
                                    return el != null;
                                });
                                
                                res.status(200).json({success: true, table: filtered});
                            })
                        }
                    })
                }
            })
        }
    })
})

exports.getStatsUrl = Controller(async(req, res) => {
    const urlQuery = req.query.url
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
                    getClicksAndViews(async function(err, rows){
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
                            let publisher = await cache.getAsync(`${req.query.url}-publisher`)

                            if(publisher){
                                publisher = JSON.parse(publisher)
                            } else {
                                publisher = await getPublisher(req.query.url)
                                cache.setAsync(`${req.query.url}-publisher`, JSON.stringify(publisher)).then()
                            } 
                            
                           getClientSessionDataByPublisherId(publisher.id, async function(err, rows){
                                if(err) {
                                    res.status(500).json(err);
                                } else {
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
                                 
                                        let adsPerImage = publisher.adsperimage
                                        let imgPerPage = imagesWithAds[Object.keys(imgsGrouped)[i]]
                                        let totImgs = imgsGrouped[Object.keys(imgsGrouped)[i]]
        
                                        let siteURL = Object.keys(imgsGrouped)[i]
        
                                        if(siteURL && !siteURL.includes('/')){
                                            siteURL += '/'
                                        }
        
                                        if(siteURL && siteURL.includes('www.')){
                                            siteURL = siteURL.replace('www.', '')
                                        }

                                        let userDuration = getUserDuration(rows, null, siteURL)
        
                                        table[i] = {
                                            url : siteURL,
                                            ads: adsGrouped[Object.keys(imgsGrouped)[i]],
                                            views: viewsGrouped[Object.keys(imgsGrouped)[i]],
                                            clicks: clicksGrouped[Object.keys(imgsGrouped)[i]],
                                            ctr: ctr,                                            
                                            clicksPerImg: clicksPerImg,
                                            viewsPerImg : viewsPerImg,
                                            clicksPerAd: clicksPerAd,
                                            viewsPerAd : viewsPerAd,                         
                                            images: imgsGrouped[Object.keys(imgsGrouped)[i]],                                            
                                            adsperimage: adsPerImage,
                                            imgNum: imgPerPage || 0,
                                            totImgs: totImgs,
                                            usercount: userDuration ? userDuration.usercount : 0, 
                                            duration: userDuration ? Math.round((userDuration.duration/60.0)*100)/100 : 0.0
                                        }
                                    }
                                    
                                    if(table.length == 0){
                                        table.push({"url":"/","clicksPerImg":0,"viewsPerImg":0,"clicksPerAd":0,"viewsPerAd":0,"ctr":0,"images":0,"ads":0,"clicks":0,"views":0,"adsNum":0,"imgNum":0,"totImgs":0})
                                    }
                                    
                                    let rewards = {};
                                    const init = new Date(req.query.init).toISOString();
                                    const fin = new Date(req.query.fin).toISOString();
                                    
                                    try{                              
                                        rewards = await cache.getAsync(`${init}_${fin}_${publisher.publisherId}`)
                                                
                                        if(rewards){
                                            rewards = JSON.parse(rewards)
                                        } else {
                                            rewards = await reportAff.report(init, fin, publisher.publisherId)
        
                                            if(rewards){
                                                cache.setAsync(`${init}_${fin}_${publisher.publisherId}`, JSON.stringify(rewards)).then()
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

    let site = urlQuery ? urlQuery.split('/')[0] : '';
    let publisher = ''

    if(site){
        publisher = await cache.getAsync(`${site}-publisher`);

        if(publisher){
            publisher = JSON.parse(publisher);
        } else {
            publisher = await getPublisher(site);
            cache.setAsync(`${site}-publisher`, JSON.stringify(publisher)).then();
        } 
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
            getAdsListPerImg(urlQuery, function(err,rows){
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
                    getImgsList(urlQuery, publisher.id, function(err, rows){
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
                                imgs.push({img: rows[i].img, title: rows[i].img.split('/')[rows[i].img.split('/').length - 1], 
                                ads: adsTotal, views: view, clicks : click, ctr: ctr, usercount: rows[i].usercount, duration: Math.round((rows[i].duration/60.0)*100)/100 })
                    
                            }
                            
                            res.status(200).json({success: true, table: imgs});
                        }
                    })
                }
            })
        }
    })
})

exports.getStatsAd = Controller(async(req, res) => {
    let { img, site } = req.query
    let clicks = {},
    views = {},
    adIcons = [],
    adURL = []
    adIds = new Set(),
    usercount = {},
    duration = {},
    ads = []

    if(site.endsWith('/')){
        site = site.substring(0, site.length - 1)
    }

    // This code is written to parse image url which contains additional '&' in its url
    for( const additionalProperty in req.query ){
        if(img && additionalProperty != 'img' && additionalProperty != 'site'){
            img += `&${additionalProperty}=${req.query[additionalProperty]}`
        }
    }
         
    getAdsList(img, site, async function(err, rows){
        if(err){
            res.status(500).json(err);
        } else {
            for (const stat of rows) {
                let id = stat.id
                adIds.add(stat.id)
                clicks[id] = !clicks[id] ? stat.clicks : (clicks[id] + stat.clicks)
                views[id] = !views[id] ? stat.views : (views[id] + stat.views)
                adIcons[id] = stat['product_image_url']
                adURL[id] = stat['product_site_url']
      
                if(!usercount[id]){
                  usercount[id] = new Set()
                }
                
                usercount[id] = usercount[id].add(stat.clientId)
                duration[id] = !duration[id] ? stat.duration : (duration[id] + stat.duration)
            }
      
            adIds.forEach(adId => {
                ads.push({
                    id: adId,
                    img: adIcons[adId],
                    adURL: adURL[adId],
                    views: views[adId],
                    clicks: clicks[adId],           
                    ctr: views[adId] == 0 ? 0.00 : Math.round((clicks[adId] / views[adId]) *100)/100,
                    usercount: views[adId] == 0 ? 0 : usercount[adId].size,
                    duration: Math.round((duration[adId]/60.0)*100)/100                   
                })
            })

            if(ads.length == 0){
                ads.push({
                    id: 0,
                    img: '',
                    adURL: '',
                    views: 0,
                    clicks: 0,                           
                    ctr: 0,
                    usercount: 0,
                    duration: 0
                })
            }

            res.status(200).json({success: true, table: ads});
        }
    })
})

function getAdsPerPage(callback){
    return db.query(`SELECT count(*) as count, site, imgName FROM ${conf.get('database')}.adspages group by site, imgName order by site asc;`, callback)
}

function getImgPerPage(callback){
    return db.query(`SELECT idGeneration as uid, count(*) as count, (select site from ${conf.get('database')}.imgspages where idGeneration = uid limit 1) as site from ${conf.get('database')}.imgspages group by idGeneration order by idGeneration asc;`,callback)
}

function getClicksAndViews(callback){
    return db.query(`SELECT url, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get('database')}.impressions group by url;`,callback)
}

function getImgsList(site, publisherId, callback){   
    return db.query(`SELECT imgcpluser.img, case when sum(imgcpluser.duration) > 0 then count(*) else 0 END as usercount, sum(imgcpluser.duration) as duration from
    (SELECT imguser.img, sum(imguser.duration) as duration from
    (SELECT cipl.clientId, ipg.img, max(cipl.duration) as duration FROM ${conf.get('database')}.imgspages ipg,  ${conf.get('database')}.clientimgpubl cipl  
    where publId = '${publisherId}' and cipl.imgUrl = ipg.img
    and (ipg.site = '${site}' or ipg.site = 'https://${site}' OR ipg.site = 'https://www.${site}' OR ipg.site = 'http://${site}' OR ipg.site = 'http://www.${site}')
    group by cipl.clientId, cipl.sessionId, ipg.img) imguser
    group by imguser.clientId, imguser.img) imgcpluser
    group by imgcpluser.img`, callback)
}

function getClientSessionDataByPublisherId(publisherId, callback){   
    return db.query(`SELECT clientId, sum(duration) as duration, site FROM ${conf.get('database')}.clientsession
    where publId = '${publisherId}'
    group by clientId, site`, callback)
}

function getAllClientSessionData(callback){   
    return db.query(`SELECT clientId, publId, sum(duration) as duration FROM ${conf.get('database')}.clientsession
    group by clientId, publId`, callback)
}

function getClicksAndViewsPerImg(site, callback){
    site = encodeURI(site)
    return db.query(`SELECT img, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get('database')}.impressions where url = 'https://${site}' OR url = 'https://www.${site}' OR url = 'http://${site}' OR url = 'http://www.${site}' group by img;`,callback)
}

function getAdsListPerImg(site, callback){
    return db.query(`SELECT imgName, idGeneration FROM ${conf.get('database')}.adspages where site = 'https://${site}' OR site = 'https://www.${site}' OR site = 'http://${site}' OR site = 'http://www.${site}' order by idGeneration desc;`,callback)
}

function getAdsList(img, site, callback){
    return db.query(`SELECT clps.id, clps.product_image_url, clps.product_site_url, clps.clientId, COALESCE(imps.clicks, 0) as clicks, COALESCE(imps.views, 0) as views, clps.duration FROM
    (SELECT adpg.id, adpg.product_image_url, adpg.product_site_url, clip.clientId, sum(clip.duration) as duration FROM ${conf.get('database')}.clientimgpubl clip,
    ${conf.get('database')}.adspages adpg
    where clip.idItem = adpg.id
    and adpg.imgName = '${img}'
    and (adpg.site = '${site}' or adpg.site = 'https://${site}' or adpg.site = 'https://www.${site}' or adpg.site = 'http://${site}' or adpg.site = 'http://www.${site}')
    group by clip.idItem, clip.clientId) clps
    left join (SELECT idItem, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) 
    AS views FROM ${conf.get('database')}.impressions imp group by imp.idItem) imps
    ON clps.id = imps.idItem
    group by clps.clientId, clps.id, clps.product_image_url, clps.product_site_url, imps.clicks, imps.views`, callback)
}

function getAdsClicksAndViews(img,site,callback){
    site = encodeURI(site)
    return db.query(`SELECT idItem, img, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ${conf.get('database')}.impressions where ( url = 'https://${site}' OR url = 'https://www.${site}' OR url = 'http://${site}' OR url = 'http://www.${site}' ) and img= '${img}' group by idItem;`,callback)
}

const getPublsh = async function(){
    const publ = await publishers.findAll()
    return publ
}

function getPublisher(site) {
    return publishers.findOne({
      where: { name: site }
    });
}

function getUserDuration(rows, publisherId, siteURL){
    const userDuration = { usercount: 0, duration: 0.0 }
    
    if(rows && rows.length >0 ){
        for(let row of rows){
            if(publisherId){
                if(row.publId == publisherId){
                    userDuration.usercount += 1
                    userDuration.duration += row.duration
                }
            }

            if(siteURL){
                let strippedSiteURL = row.site

                if(strippedSiteURL.includes('//')){
                    strippedSiteURL = strippedSiteURL.split('//')[1]
                }

                if(strippedSiteURL.includes('www.')){
                    strippedSiteURL = strippedSiteURL.split('www.')[1]
                }

                if(strippedSiteURL == siteURL){
                    userDuration.usercount += 1
                    userDuration.duration += row.duration
                }
            }
        }
    }

    return userDuration
}