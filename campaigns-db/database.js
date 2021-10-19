const Sequelize  = require('sequelize');

const sequelize = new Sequelize("campaings","rodrigo","19892206-4",{
    dialect: 'mysql',
    host: 'localhost',
    pool: {
      max : 100,
      min : 0,
      idle: 30000,
      acquire: 1000000 
    },
  });

  module.exports = sequelize;