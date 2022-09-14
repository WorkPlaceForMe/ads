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
        onDelete: 'CASCADE',
        references: {
          model: 'client',
          key: 'id'
       }
      },
      publId: {
        type: Sequelize.STRING(45),
        allowNull: false,
        onDelete: 'CASCADE',
        references: {
          model: 'publishers',
          key: 'id'
       }
      },
      site: {
        type: Sequelize.STRING(600),
        allowNull: true,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      },
      createdAt: {
        type: Sequelize.DATE
      }
    }, {
      freezeTableName: true
  });
  
    return Rel
  }
