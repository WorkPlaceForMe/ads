const csv = require('csv-parser')
const fs = require('fs')


exports.readCsv = new Promise(async (resolve, reject) =>{

    const results = [];

    fs.createReadStream('./csv/520.CSV')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        resolve(results)
      });
})