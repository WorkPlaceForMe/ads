const objetos = require('../../csv/objetos2.json')
const parseCsv = require('csv-parse')
const { createProducts } = require('./productClothingCreator')

exports.readCsv = function(data, id) {
    const promises = []
    var sendDate = new Date().getTime()

    return new Promise((resolve, reject) => {    
      data.pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
        .on('data', function (csvrow) {
          try { 
            for (const element of objetos['Products']) {
              if (csvrow[15] && 
                csvrow[15].toLowerCase().toLowerCase().includes(element)
              ) {
                const product = createProducts(csvrow, element, id, 'Lazada')
                promises.push(product)
              } else if (csvrow[17] &&
                csvrow[17].toLowerCase().includes(element)
              ) {
                const product = createProducts(csvrow, element, id, 'Lazada')
                promises.push(product)
              } else if (csvrow[13] &&
                csvrow[13].toLowerCase().toLowerCase().includes(element)
              ) {
                const product = createProducts(csvrow, element, id, 'Lazada')
                promises.push(product)
              }
            }
            
            if (csvrow[13] && csvrow[13].toLowerCase().includes('beauty')){
              const product = createProducts(csvrow, 'makeup', id, 'Lazada')
              promises.push(product)
            }
          } catch(err) {
            console.log('Error in reading csv row')
            console.log(err)
          }
        })
        .on('error', error => {
          console.log('Error in reading csv file')
          console.log(error)
          reject(error)
        })
        .on('end', async () => {
          const products = await Promise.all(promises)
          var receiveDate = new Date().getTime()
          var responseTimeMs = receiveDate - sendDate
          console.log(`Completed setup for site ${id} for provider Lazada in ${responseTimeMs}ms`)     
          const dataValues = products.map((objects) => objects.dataValues)
    
          resolve(dataValues)
        })
    })
  }