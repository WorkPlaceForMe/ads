const Controller = require('../helper/controller')
const db1 = require('../campaigns-db/database')
const publishers = db1.publishers
const cache = require('../helper/cacheManager')

exports.updateAds = Controller(async(req, res) => {
    const data = req.body
    await update(data,req.params.id)
    await cache.cleardb()

    res.status(200).json({success: true});
})

async function update(body,id) {
    const publ = await publishers.findOne({
        where: { name: id },
    })
    console.log(publ)
    if(publ.dataValues.pages == null){
        await publ.update({pages: body})
    }else{
        body[2] = publ.dataValues.pages[2]
        await publ.update({pages: body})
    }
    return publ
}
