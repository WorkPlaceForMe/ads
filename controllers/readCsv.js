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

    fs.createReadStream('./csv/file.csv')
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => {
        console.log(results[0]);
        resolve(results)
        // [
        //   { NAME: 'Daffy Duck', AGE: '24' },
        //   { NAME: 'Bugs Bunny', AGE: '22' }
        // ]
      });

    // const userAffiliate = conf.get('accesstrade_user')
    // const passAffiliate = CryptoJS.MD5(conf.get('accesstrade_pass'))
    // const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/publishers/auth/${userAffiliate}`

    // var userPass = CryptoJS.SHA256(`${userAffiliate}:${passAffiliate}`)

    // try{
    //     const affiliateResponse = await axios.get(affiliateEndpoint, {
    //         headers: {
    //             Authorization: userPass
    //         }
    //     })
    //     resolve(affiliateResponse.data)
    // } catch(err) {
    //     console.error(err)
    //     reject(err)
    // }
})