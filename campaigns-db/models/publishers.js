module.exports = (sequelize, Sequelize) => {
    const publishers = sequelize.define("publishers", {
        id: {
            type: Sequelize.STRING(40),
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING(200),
            allowNull: true,
        },
        nickname: {
            type: Sequelize.STRING(200),
            allowNull: true
        },
        hostname: {
            type: Sequelize.STRING(200),
            allowNull: true
        },
        enabled: {
            type: Sequelize.STRING(45),
            allowNull: true,
        },
        publisherId: {
            type: Sequelize.STRING(45),
            allowNull: true
        },
        pages: {
            type: Sequelize.JSON,
            allowNull: true,
        },
        adsperimage: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 1
        },
        adsperpage: {
            type: Sequelize.INTEGER,
            allowNull: true,
            defaultValue: 1
        }
    });
  
    return publishers;
  };