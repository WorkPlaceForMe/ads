const Controller = require('../helper/controller')
const db = require('../helper/dbconnection')
const crt = require('../helper/createWebsite')
const { v4: uuidv4 } = require('uuid')

exports.auth = Controller(async(req, res) => {

    check(req.params.id, function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            if(rows.length == 0){
                return res.status(401).json({success: false, type: 'notFound', message: 'Secret Code not valid'});
            }else{
                const site = rows[0].name
                res.status(200).json({success: true, site: site});
            }
        }
    })
})

exports.check = Controller(async(req, res) => {

    checkSite(req.query.site.split('/')[2], async function(err,rows){
        if(err){
            res.status(500).json(err);
            }
        else{
            if(rows.length == 0){
                const locId = uuidv4();
                await crt.create(locId,req.query.site.split('/')[2],req.query.site.split('/')[0])
                return res.status(200).json({success: true, message: 'Site registered'});
            }else{
                const site = rows[0].name
                res.status(200).json({success: true, site: site, message: 'Site already registered'});
            }
        }
    })
})

function check(id,callback){
    return db.query(`SELECT * from publishers where id ='${id}'`,callback)
}

function checkSite(site,callback){
    return db.query(`SELECT * from publishers where name ='${site}'`,callback)
}