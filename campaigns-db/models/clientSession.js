module.exports = (sequelize, Sequelize) => {
    const Rel = sequelize.define('clientsession', {
      id: {
        type: Sequelize.STRING(100),
        allowNull: false,
        primaryKey: true
      },
      clientId: {
        type: Sequelize.STRING(100),
        allowNull: false,
        references: {
          model: 'client',
          key: 'id'
       }
      },
      publId: {
        type: Sequelize.STRING(45),
        allowNull: false,
        references: {
          model: 'publishers',
          key: 'id'
       }
      },
      createdAt: {
        type: Sequelize.DATE
      }
    }, {
      freezeTableName: true
  });
  
    return Rel
  }
