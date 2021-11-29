const Controller = require('../helper/controller')
const db1 = require('../campaigns-db/database')
const publishers = db1.publishers

exports.updateAds = Controller(async(req, res) => {
    const data = req.body
    await update(data,req.params.id)
    res.status(200).json({success: true});
})

async function update(body,id) {
    const publ = await publishers.findOne({
        where: { name: id },
    })
    await publ.update({pages: body})
    return publ
}