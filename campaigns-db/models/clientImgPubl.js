module.exports = (sequelize, Sequelize) => {
    const Rel = sequelize.define('clientimgpubl', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      clientId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        references: {
          model: 'client',
          key: 'id'
       }
      },
      sessionId: {
        type: Sequelize.STRING(100),
        allowNull: true,
        references: {
          model: 'clientsession',
          key: 'id'
       }
      },
      imgId: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'imgspages',
          key: 'id'
       }
      },
      imgUrl: {
        type: Sequelize.STRING(600),
        allowNull: true
      },
      publId: {
        type: Sequelize.STRING(40),
        allowNull: true,
        references: {
          model: 'publishers',
          key: 'id'
       }
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      }
    }, {
      freezeTableName: true
  });
  
    return Rel
  }
