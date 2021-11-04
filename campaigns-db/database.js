const Sequelize  = require('sequelize');
const conf = require('../middleware/prop')

const sequelize = new Sequelize(conf.get('database'),conf.get('user'),conf.get('password'),{
    dialect: 'mysql',
    host: conf.get('host'),
    pool: {
      max : 100,
      min : 0,
      idle: 30000,
      acquire: 1000000 
    },
  });

  module.exports = sequelize;