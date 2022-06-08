const Sequelize = require('sequelize')
const conf = require('../middleware/prop')

const sequelize = new Sequelize(
  conf.get('database'),
  conf.get('user'),
  conf.get('password'),
  {
    dialect: 'mysql',
    host: conf.get('host'),
    pool: {
      max: 100,
      min: 0,
      idle: 600000,
      acquire: 1000000,
    },
    charset: 'utf8mb4',
    collate: 'utf8mb4_general_ci',
    logging: false,
  },
)

const db = {}

db.Sequelize = Sequelize
db.sequelize = sequelize

db.adsPage = require('./models/adsPage')(sequelize, Sequelize)
db.clothing = require('./models/clothing')(sequelize, Sequelize)
db.imgsPage = require('./models/imgsPage')(sequelize, Sequelize)
db.impressions = require('./models/impressions')(sequelize, Sequelize)
db.products = require('./models/products')(sequelize, Sequelize)
db.publishers = require('./models/publishers')(sequelize, Sequelize)
db.users = require('./models/user')(sequelize, Sequelize)
db.client = require('./models/client')(sequelize, Sequelize)
db.clientImgPubl = require('./models/clientImgPubl')(sequelize, Sequelize)
db.clientSession = require('./models/clientSession')(sequelize, Sequelize)

db.client.belongsToMany(db.publishers, {
  through: {
    model: 'clientimgpubl',
    unique: false
  },
  foreignKey: 'clientId',
  otherKey: 'publId',
  constrains: false
})

db.publishers.belongsToMany(db.client, {
  through: {
    model: 'clientimgpubl',
    unique: false
  },
  foreignKey: 'id',
  otherKey: 'clientId',
  constrains: false
})

db.client.belongsToMany(db.imgsPage, {
  through: {
    model: 'clientimgpubl',
    unique: false
  },
  foreignKey: 'clientId',
  otherKey: 'imgId',
  constrains: false
})

db.imgsPage.belongsToMany(db.client, {
  through: {
    model: 'clientimgpubl',
    unique: false
  },
  foreignKey: 'id',
  otherKey: 'clientId',
  constrains: false
})

db.publishers.belongsToMany(db.imgsPage, {
  through: {
    model: 'clientimgpubl',
    unique: false
  },
  foreignKey: 'id',
  otherKey: 'imgId',
  constrains: false
})

db.imgsPage.belongsToMany(db.publishers, {
  through: {
    model: 'clientimgpubl',
    unique: false
  },
  foreignKey: 'id',
  otherKey: 'publId',
  constrains: false
})

module.exports = db
