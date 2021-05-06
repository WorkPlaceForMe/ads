const conf = require('../middleware/prop')
const Controller = require('../helper/controller')
const csv = require('csv-parser')
const fs = require('fs')
const path = require('path')


exports.readCsv = Controller(async(req, res) => {
const results = [];

fs.createReadStream('./csv/file.csv')
  .pipe(csv())
  .on('data', (data) => results.push(data))
  .on('end', () => {
    console.log(results[0]);
    res.status(200).json({success: true, data: results[0]})
    // [
    //   { NAME: 'Daffy Duck', AGE: '24' },
    //   { NAME: 'Bugs Bunny', AGE: '22' }
    // ]
  });
})

exports.readCsv = new Promise(async (resolve, reject) =>{

    const results = [];

    fs.createReadStream('./csv/520.CSV')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results)
      });
})