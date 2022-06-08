module.exports = (sequelize, Sequelize) => {
    const Rel = sequelize.define('clientsession', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
      },
      clientId: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      publId: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      createdAt: {
        type: Sequelize.DATE
      }
    }, {
      freezeTableName: true
  });
  
    return Rel
  }
