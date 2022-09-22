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
        product_site_url: {
            type: Sequelize.TEXT,
            allowNull: true
        },
        product_image_url: {
            type: Sequelize.STRING(1234),
            allowNull: true
        },
        product_main_category_name: {
            type: Sequelize.STRING,
            allowNull: true
        },
        vista_keywords: {
            type: Sequelize.STRING,
            allowNull: true
        },
        site: {
            type: Sequelize.STRING(600),
            allowNull: true,
        },
        time :{
            type: Sequelize.DATE,
            allowNull: true
        },
        imgName :{
            type: Sequelize.STRING(600),
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