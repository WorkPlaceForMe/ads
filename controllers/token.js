const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const jwt = require('jsonwebtoken')

exports.getToken = Controller(async(req, res) => {
    const now = Date.now()  
    const token = jwt.sign(
        { sub: conf.get('userUid'), iat: now},
        conf.get('secretKey'),
        {
          algorithm: "HS256"
        }
      )

    res.status(200).send({
        success: true, data: token
    })
})