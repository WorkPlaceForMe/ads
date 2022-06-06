module.exports = (sequelize, Sequelize) => {
    const Client = sequelize.define('client', {
      clientId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
    //   clientId: {
    //     type: Sequelize.STRING,
    //     allowNull: false,
    //   }
    })
  
    return Client
  }
  