const Controller = require('../helper/controller')
const dateFormat = require('dateformat');
const db1 = require('../campaigns-db/database')
const impressions = db1.impressions

exports.postData = Controller(async(req, res) => {

    const data = req.body
    const nD = dateFormat(data.time, "yyyy-mm-dd HH:MM:ss");
    try{
        await add(data.type,nD,data.url,data.idItem,data.img)
        res.status(200).json({success: true});
    }catch(err){
        res.status(500).json(err);
    }
})

async function add(type,date,url,id,img) {
    return impressions.create({
        type: type,
        time :date,
        url: url,
        idItem :id,
        img: img
    })
}