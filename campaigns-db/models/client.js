module.exports = (sequelize, Sequelize) => {
    const Client = sequelize.define('client', {
      id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        primaryKey: true
      }
    }, {
      freezeTableName: true
  });
  
    return Client
  }
  