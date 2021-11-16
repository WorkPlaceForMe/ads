module.exports = (sequelize, Sequelize) => {
    const products = sequelize.define("products", {
  Merchant_Product_ID: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  Merchant_Product_Name: {
    type: Sequelize.STRING(1234),
    allowNull: true,
  },
  Image_URL: {
    type: Sequelize.STRING(1234),
    allowNull: true,
  },
  Product_URL_Web_encoded: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  Product_URL_Mobile_encoded: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  Description: {
    type: Sequelize.TEXT,
    allowNull: true
  },
  Price: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  Descount: {
    type: Sequelize.INTEGER,
    allowNull: true
  },
  Available: {
    type: Sequelize.BOOLEAN,
    allowNull: true
  },
  Main_Category_Name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  Category_Name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  Sub_Category_Name: {
    type: Sequelize.STRING,
    allowNull: true
  },
  Price_Unit: {
    type: Sequelize.STRING,
    allowNull: true
  },
  Page_ID:{
    type: Sequelize.INTEGER,
    allowNull: true
  },
  label: {
    type: Sequelize.STRING,
    allowNull: true
  }
    });
  
    return products;
  };
