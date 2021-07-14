const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')

exports.modify = Controller(async(req, res) => {

    modify(req.params.id, req.params.value , function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            res.status(200).json(rows);
            }
    })
})

function modify(id,value,callback){
    return db.query(`UPDATE publishers set enabled = '${value}' where id ='${id}'`,callback)
}