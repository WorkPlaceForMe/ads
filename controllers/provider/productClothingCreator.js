const db = require('../../campaigns-db/database')
const products = db.products
const clothing = db.clothing

exports.createProducts = (csvrow, element, id) => {
    const objects = products.create({
      Merchant_Product_Name: csvrow[1],
      Image_URL: csvrow[2],
      Product_URL_Web_encoded: csvrow[4],
      Product_URL_Mobile_encoded: csvrow[5],
      Description: csvrow[6],
      Price: csvrow[7],
      Descount: csvrow[8],
      Available: csvrow[9],
      Main_Category_Name: csvrow[13],
      Category_Name: csvrow[15],
      Sub_Category_Name: csvrow[17],
      Price_Unit: csvrow[18],
      Page_ID: id,
      label: element,
      Type: 'products',
    })
    return objects
  }
  
  exports.createClothing = (csvrow, id, gender) => {
    const garment = clothing.create({
      Merchant_Product_Name: csvrow[1],
      Image_URL: csvrow[2],
      Product_URL_Web_encoded: csvrow[4],
      Product_URL_Mobile_encoded: csvrow[5],
      Description: csvrow[6],
      Price: csvrow[7],
      Descount: csvrow[8],
      Available: csvrow[9],
      Main_Category_Name: csvrow[13],
      Category_Name: csvrow[15],
      Sub_Category_Name: csvrow[17],
      Price_Unit: csvrow[18],
      Page_ID: id,
      Gender: gender,
      Type: 'clothing',
    })
    return garment
  }