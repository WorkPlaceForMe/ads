const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const dateFormat = require('dateformat');

exports.postData = Controller(async(req, res) => {

    const data = req.body
    const nD = dateFormat(data.time, "yyyy-mm-dd HH:MM:ss");
    add(data.type,nD,data.url,data.idItem,data.img,function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            res.status(200).json(rows);
            }
    })
    // res.status(200).json({success: true})
})

function add(type,date,url,id,img,callback){
    return db.query(`INSERT INTO impressions values (0,${type},'${date}','${url}','${id}','${img}')`,callback)
}