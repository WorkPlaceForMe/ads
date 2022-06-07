module.exports = (sequelize, Sequelize) => {
    const Rel = sequelize.define('clientimgpubl', {
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
      imgId: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      publId: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      duration: {
        type: Sequelize.INTEGER,
        allowNull: false,
      }
    })
  
    return Rel
  }
