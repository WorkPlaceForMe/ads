module.exports = (sequelize, Sequelize) => {
    const publishers = sequelize.define("publishers", {
        id: {
            type: Sequelize.STRING(40),
            primaryKey: true,
        },
        name: {
            type: Sequelize.STRING(45),
            allowNull: true,
        },
        nickname: {
            type: Sequelize.STRING(45),
            allowNull: true,
        },
        enabled: {
            type: Sequelize.STRING(45),
            allowNull: true,
        },
        publisherId: {
            type: Sequelize.STRING(45),
            allowNull: true,
        },
        pages: {
            type: Sequelize.JSON,
            allowNull: true,
        }
    });
  
    return publishers;
  };