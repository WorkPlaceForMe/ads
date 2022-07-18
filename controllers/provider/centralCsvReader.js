const objetos = require('../../csv/objetos2.json')
const parseCsv = require('csv-parse')
const { createProducts, createClothing } = require('./productClothingCreator')

exports.readCsv = async function(data, id) {
    const promises = []
    console.log('piping')
    var sendDate = new Date().getTime()
    
    data.pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
      .on('data', function (csvrow) {
        try { 
          for (const element of objetos['Products']) {
            if (csvrow[15] && 
              csvrow[15].toLowerCase().toLowerCase().includes(element)
            ) {
              const product = createProducts(csvrow, element, id)
              promises.push(product)
            } else if (csvrow[17] &&
              csvrow[17].toLowerCase().includes(element)
            ) {
              const product = createProducts(csvrow, element, id)
              promises.push(product)
            } else if (csvrow[13] &&
              csvrow[13].toLowerCase().toLowerCase().includes(element)
            ) {
              const product = createProducts(csvrow, element, id)
              promises.push(product)
            }
          }
          
          if (csvrow[13] && ((csvrow[13].toLowerCase().includes('women') && csvrow[15].toLowerCase().includes('clothing'))
          || csvrow[13].toLowerCase().includes('women sportswear'))) {
            const gender = 'Female'
            const garment = createClothing(csvrow, id, gender)
            promises.push(garment)
          }
          
          if (csvrow[13] && (csvrow[13].toLowerCase().includes('men clothing') || csvrow[13].toLowerCase().includes('men sportswear'))) {
            const gender = 'Male'
            const garment = createClothing(csvrow, id, gender)
            promises.push(garment)
          }
          
          if (
            csvrow[13] && csvrow[13].toLowerCase().includes('sport') &&
            !csvrow[13].toLowerCase().includes('sportswear')
          ) {
            const product = createProducts(csvrow, 'sport', id)
            promises.push(product)
          }
          
          if (csvrow[13] && (csvrow[13].toLowerCase().includes('beauty') || csvrow[13].toLowerCase().includes('makeup')
          || csvrow[13].toLowerCase().includes('make-up'))){
            const product = createProducts(csvrow, 'makeup', id)
            promises.push(product)
          }

          if (csvrow[15] && csvrow[15].toLowerCase().includes('mobile')) {
            const product = createProducts(csvrow, 'cell_phone', id)
            promises.push(product)
          }
        } catch(e) {
          console.log('Error in reading csv row')
          console.log(e)
        }
      })
      .on('end', async () => {
        const todo = await Promise.all(promises)
        console.log(`done with provider Central`)
        var receiveDate = new Date().getTime()
        var responseTimeMs = receiveDate - sendDate
        console.log(responseTimeMs)      
        const dataValues = todo.map((objects) => objects.dataValues)
  
        return dataValues
      })
  }