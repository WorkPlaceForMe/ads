module.exports = (sequelize, Sequelize) => {
    const Rel = sequelize.define('clientimgpubl', {
      id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        autoIncrement: true,
        primaryKey: true
      },
      clientId: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: {
          model: 'client',
          key: 'id'
       }
      },
      sessionId: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: {
          model: 'clientsession',
          key: 'id'
       }
      },
      imgId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'imgspages',
          key: 'id'
       }
      },
      imgUrl: {
        type: Sequelize.STRING(200),
        allowNull: false
      },
      publId: {
        type: Sequelize.STRING(40),
        allowNull: false,
        references: {
          model: 'publishers',
          key: 'id'
       }
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0
      }
    }, {
      freezeTableName: true
  });
  
    return Rel
  }
