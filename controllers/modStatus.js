const Controller = require('../helper/controller')
const db = require('../campaigns-db/database')
const cache = require('../helper/cacheManager')

exports.modify = Controller(async(req, res) => {

    try {
        db.publishers.update(
            {
                enabled: req.params.value
            },
            {
            where: {
                id: req.params.id
            }
        }).then(async (ids) => {               
            if(ids && ids[0]) {
                const publisher = await db.publishers.findOne({
                    where: { id: req.params.id }
                })
                
                cache.setAsync(`${publisher.name}-publisher`, JSON.stringify(publisher))
            }
        })  

        res.status(200).json({success: true})    
    } catch(err) {
        res.status(500).json({success: false, mess: err})
    }
})