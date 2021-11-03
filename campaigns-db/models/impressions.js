module.exports = (sequelize, Sequelize) => {
    const impressions = sequelize.define("impressions", {
        idImpressions: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        type: {
            type: Sequelize.INTEGER,
            allowNull: true,
        },
        time :{
            type: Sequelize.DATE,
            allowNull: true
        },
        url: {
            type: Sequelize.STRING(200),
            allowNull: true,
        },
        idItem :{
            type: Sequelize.BIGINT(11),
            allowNull: true
        },
        img :{
            type: Sequelize.STRING(200),
            allowNull: true
        },
    });
  
    return impressions;
  };