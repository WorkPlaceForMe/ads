const Controller = require('../helper/controller')
const bcrypt = require('bcrypt')
const db1 = require('../campaigns-db/database')
const User = db1.users
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')

exports.login = Controller(async (req, res) => {
  const reqBody = req.body
  if (!reqBody.username || !reqBody.password) {
    return res.status(400).send({
      success: false,
      message: 'Username & password both are required',
    })
  }

  const user = await User.findOne({ where: { username: reqBody.username } })
  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'User not exists',
      type: 'user'
    })
  }

  const isSame = await bcrypt.compare(reqBody.password, user.password)
  if (!isSame) {
    return res.status(400).send({
      success: false,
      message: 'Invalid password provided',
      type: 'pass'
    })
  }

  const exp = 43200

  const token = jwt.sign(
    { id: user.id  },
    conf.get('accesstrade_pass'),
    {
      expiresIn: exp // 12 hours
    }
  )

  delete user.dataValues.password
  user.dataValues['accessToken'] = token

  res.status(200).json({
    success: true,
    message: 'You are logged in successfully',
    user: user
  })
})
