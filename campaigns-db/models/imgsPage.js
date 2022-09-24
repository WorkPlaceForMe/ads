module.exports = (sequelize, Sequelize) => {
    const imgsPage = sequelize.define("imgspages", {
            id: {
            type: Sequelize.INTEGER,
            autoIncrement: true,
            primaryKey: true,
        },
        time:{
            type: Sequelize.DATE,
            allowNull: true
        },
        img:{
            type: Sequelize.STRING(600),
            allowNull: true
        },
        idGeneration :{
            type: Sequelize.BIGINT(11),
            allowNull: true
        },
        site :{
            type: Sequelize.STRING(200),
            allowNull: true
        }
    },{
        freezeTableName: true
    });
  
    return imgsPage;
  };