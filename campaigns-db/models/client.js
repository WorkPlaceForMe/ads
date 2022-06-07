module.exports = (sequelize, Sequelize) => {
    const Client = sequelize.define('client', {
      clientId: {
        type: Sequelize.STRING(40),
        allowNull: false,
        primaryKey: true,
      },
    })
  
    return Client
  }
  