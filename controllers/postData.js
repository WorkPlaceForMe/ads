const Controller = require('../helper/controller')
const dateFormat = require('dateformat');
const db = require('../campaigns-db/database')
const { getStrippedURL } = require('../helper/util')

exports.postData = Controller(async(req, res) => {

    const data = req.body
    const nD = dateFormat(data.time, "yyyy-mm-dd HH:MM:ss");
    let site = data.site.split('/')[2];
    
    if (site.includes('www.')) {
        site = site.split('w.')[1]
    }
    
    if(data.url){
      data.url = getStrippedURL(data.url)
    }

    try{
        await add(data.type,nD,data.url,data.idItem,data.img);
        let img = await getImg(data.img);
        let publisher = await getPublisher(site);

        if(img && publisher){
          await updateDurationInImgPublData(data.userId, data.sessionId, img.img, publisher.id);
        }
        res.status(200).json({success: true});
    }catch(err){
        res.status(500).json(err);
    }
})

async function add(type,date,url,id,img) {
    return db.impressions.create({
        type: type,
        time :date,
        url: url,
        idItem :id,
        img: img
    })
}

function getImg(url){
    return db.imgsPage.findOne({
      where: { img: url }
    });
}
  
function getPublisher(site) {
    return db.publishers.findOne({
      where: { name: site }
    });
}

function updateDurationInImgPublData(clientId, sessionId, imgUrl, publisherId) {
  return db.clientImgPubl.update(
    {
      duration: db.sequelize.fn(
        'timestampdiff', 
        db.sequelize.literal("second"),
        db.sequelize.col('createdAt'),
        db.sequelize.literal('CURRENT_TIMESTAMP')
    )     
    },
    {
      where: {
        clientId: clientId,
        sessionId: sessionId,
        imgUrl: imgUrl,
        publId: publisherId
      },
    }
  );
}