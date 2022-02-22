const Controller = require('../helper/controller')
const db1 = require('../campaigns-db/database')
const publishers = db1.publishers
const { v4: uuidv4 } = require('uuid')
const conf = require('../middleware/prop')

exports.register = Controller(async(req, res) => {
    const locId = uuidv4();
    const data = req.body
    try{
        await registerDb(locId, data.name, data.nickname)
        res.status(200).json({success: true});
    }catch(err){
        res.status(500).json({success: false, mess: err})
    }

})

exports.update = Controller(async(req, res) => {
    const data = req.body
    try{
        await updateDb(data)
        res.status(200).json({success: true});
    }catch(err){
        res.status(500).json({success: false, mess: err})
    }
})

exports.get = Controller(async(req, res) => {
    const publ = await publishers.findOne({
        where: { id: req.params.id },
    })
    res.status(200).json({success: true, publ: publ});
})

exports.getAll = Controller(async(req, res) => {
    const publ = await publishers.findAll()
    res.status(200).json({success: true, publ: publ});
})

exports.getServer = Controller(async(req, res) => {
    const server = conf.get('server')
    res.status(200).json({success: true, server: server});
})

exports.del = Controller(async(req, res) => {
    const data = req.params.id
    delSite(data)
    res.status(200).json({success: true});
})

const registerDb = async function(id,site, nickname){
    return publishers.create({
        id: id,
        name: site,
        nickname: nickname,
        enabled: 'false',
        })
}

async function updateDb(body) {
    const publ = await publishers.findOne({
        where: { id: body.id },
    })
    await publ.update({name: body.name, nickname: body.nickname})
    return publ
}

const delSite = async function(id){
    return publishers.destroy({
      where: { id: id }
    })
}

