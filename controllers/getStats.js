const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')

exports.getStats = Controller(async(req, res) => {
    let ads = {},
    clicks = [],
    imgs = {}
    getAdsPerPage(function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            for(const stat of rows){
                ads[stat.site] = stat.count
            }
            getImgPerPage(function(err,rows){
                if(err){
                    res.status(500).json(err);
                    }
                else{
                    for(const stat of rows){
                        imgs[stat.site] = stat.count
                    }
                    getClicksAndViews(function(err,rows){
                        if(err){
                            res.status(500).json(err);
                            }
                        else{
                            clicks = rows
                            let table = []
                            // console.table(rows)
                            for(let i = 0; i < Object.keys(imgs).length; i++){
                                if(!clicks[i]){
                                    clicks[i] = {
                                        clicks: 0,
                                        views: 0
                                    }
                                }
                                if(ads[Object.keys(imgs)[i]] == undefined || ads[Object.keys(imgs)[i]] == null){
                                    ads[Object.keys(imgs)[i]] = 0;
                                }
                                let ctr = Math.round(((Math.round((clicks[i].clicks / imgs[Object.keys(imgs)[i]]) * 100) / 100) / (Math.round((clicks[i].views / imgs[Object.keys(imgs)[i]]) * 100) / 100)) * 100) / 100;
                                if(Number.isNaN(ctr)){
                                    ctr = 0;
                                }
                                let clicksPerImg = Math.round((clicks[i].clicks / imgs[Object.keys(imgs)[i]]) * 100) / 100;
                                if(Number.isNaN(clicksPerImg)){
                                    clicksPerImg = 0;
                                }
                                let viewsPerImg = Math.round((clicks[i].views / imgs[Object.keys(imgs)[i]]) * 100) / 100;
                                if(Number.isNaN(viewsPerImg)){
                                    viewsPerImg = 0;
                                }
                                let clicksPerAd = Math.round((clicks[i].clicks / ads[Object.keys(imgs)[i]]) * 100) / 100;
                                if(Number.isNaN(clicksPerAd)){
                                    clicksPerAd = 0;
                                }
                                let viewsPerAd = Math.round((clicks[i].views / ads[Object.keys(imgs)[i]]) * 100) / 100;
                                if(Number.isNaN(viewsPerAd)){
                                    viewsPerAd = 0;
                                }
                                table[i] = {
                                    url : Object.keys(imgs)[i],
                                    clicksPerImg: clicksPerImg,
                                    viewsPerImg : viewsPerImg,
                                    clicksPerAd: clicksPerAd,
                                    viewsPerAd : viewsPerAd,
                                    ctr: ctr,
                                    images: imgs[Object.keys(imgs)[i]],
                                    ads: ads[Object.keys(imgs)[i]],
                                    clicks: clicks[i].clicks,
                                    views: clicks[i].views
                                }
                            }
                            console.table(table)
                            res.status(200).json({success: true, table: table});
                        }
                    })
                }
            })
        }
    })
    // res.status(200).json({success: true})
})

function getAdsPerPage(callback){
    return db.query(`SELECT count(*) as count, idGeneration as uid, (select site from ads.adsPage where idGeneration = uid limit 1) as site FROM ads.adsPage group by idGeneration order by uid asc`,callback)
}

function getImgPerPage(callback){
    return db.query(`SELECT idGeneration as uid, count(*) as count, (select site from ads.imgsPage where idGeneration = uid limit 1) as site from ads.imgsPage group by idGeneration order by idGeneration asc;`,callback)
}

function getClicksAndViews(callback){
    return db.query(`SELECT url, COUNT( CASE WHEN type = '2' THEN 1 END ) AS clicks, COUNT( CASE WHEN type = '1' THEN 1 END ) AS views FROM ads.impressions group by url;`,callback)
}

