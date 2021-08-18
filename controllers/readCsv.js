const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const fs = require('fs');
const csv = require('csv-parser')

exports.readCsv = async function(idPbl){
  return new Promise(function(resolve, reject){
    const ids = {
        lazada : 520,
        trueShopping : 594,
        shopee : 677
    }
    let result = []

        aff.getAff.then(async function(credentials){
            const token = jwt.sign(
                { sub: credentials.userUid},
                credentials.secretKey,
                {
                algorithm: "HS256"
                }
            )
            
            for(const id in ids){            
            const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/${ids[id]}/productfeed/url`

            try{
                const affiliateResponse = await axios.get(affiliateEndpoint, {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'X-Accesstrade-User-Type': 'publisher'
                        }
                })
                try{
                  const download = await axios.get(affiliateResponse.data.baseUrl)
                  const data = await csvToArray(download.data)

                  result = result.concat(data)
                  // resolve(data)

                } catch(err) {
                    console.error(err)
                }

            } catch(err) {
                // console.error(err)
                continue;
            }}

            resolve(result)
        }).catch((err)=>{reject(err)})
      })
}
// exports.readCsv = new Promise(async (resolve, reject) =>{
// const results = [];
// fs.createReadStream('./csv/data.csv')
//       .pipe(csv())
//       .on('data', (data) => results.push(data))
//       .on('end', () => {
//         resolve(results)
//       });
// }) 

async function csvToArray(str, delimiter = ",") {
  const headers = str.slice(0, str.indexOf("\n")).split(delimiter);

  const rows = str.slice(str.indexOf("\n") + 1).split("\n");

  const arr = rows.map(function (row) {
    const values = row.split(delimiter);
    const el = headers.reduce(function (object, header, index) {
      object[header] = values[index];
      return object;
    }, {});
    return el;
  });

  return arr;
}