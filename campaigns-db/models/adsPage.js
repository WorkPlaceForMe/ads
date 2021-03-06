module.exports = (sequelize, Sequelize) => {
    const adsPage = sequelize.define("adspages", {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        idItem: {
            type: Sequelize.STRING(200),
            allowNull: true,
        },
        site: {
            type: Sequelize.STRING(200),
            allowNull: true,
        },
        time :{
            type: Sequelize.DATE,
            allowNull: true
        },
        imgName :{
            type: Sequelize.STRING(200),
            allowNull: true
        },
        idGeneration :{
            type: Sequelize.BIGINT(11),
            allowNull: true
        },
    },{
        freezeTableName: true
    });
  
    return adsPage;
  };