const axios = require('axios')
const aff = require('../helper/affiliate')
const jwt = require('jsonwebtoken')
const conf = require('../middleware/prop')
const fs = require('fs');
const cache = require('../helper/cacheManager')
const https = require('https');
const { parse } = require('url')
const parseCsv = require('csv-parse');
const objetos = require('../csv/objetos2.json');
const arrObjetos = Object.keys(objetos[0])
const WomenClothes = Object.keys(objetos[1]['Women Clothes'])
const MenClothes = Object.keys(objetos[1]["Men Clothes"])

exports.readCsv = async function (idPbl) {
  if (fs.existsSync(`./csv/${idPbl}.json`)) {
    return new Promise((resolve, reject) => {
      let res = require(`../csv/${idPbl}.json`);
      resolve(res)
    })
  }
  let cachedDown = await cache.getAsync(`downloading-${idPbl}`);
  if (cachedDown == 'false' || !cachedDown) {
    await cache.setAsync(`downloading-${idPbl}`, true);
    return new Promise(function (resolve, reject) {
      // const ids = {
      //     //lazada : 520,
      //     //trueShopping : 594,
      //     shopee : 677
      // }
      // let result = []
      aff.getAff.then(async function (credentials) {
        const token = jwt.sign(
          { sub: credentials.userUid },
          credentials.secretKey,
          {
            algorithm: "HS256"
          }
        )
        // for(const id in ids){

        let campaignEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/affiliated`
        
        try {
          const campaignResponse = await axios.get(campaignEndpoint, {
            headers: {
              'Authorization': `Bearer ${token}`,
              'X-Accesstrade-User-Type': 'publisher'
            }
          })
          let results;
          for(const campaign of campaignResponse.data){
            if(campaign.id == 677){
              try {
                let affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${idPbl}/campaigns/${campaign.id}/productfeed/url`
                const affiliateResponse = await axios.get(affiliateEndpoint, {
                  headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Accesstrade-User-Type': 'publisher'
                  }
                })
                console.log(`Downloading shopee`)
                await download(affiliateResponse.data.baseUrl, idPbl)

                results = await readCsv(idPbl)


              } catch (err) {
                console.error(err)
              }
            }
          }
          resolve(results)
        } catch (err) {
          console.error(err)
        }
        // }
        // fs.promises.createWriteStream(`./csv/${idPbl}.csv`, JSON.stringify(result, null, 2) , 'utf-8');
        // resolve(result)
      }).catch((err) => {
        // console.error(err)
        reject(err)
      })
    })
  }
  else {
    cachedDown = await cache.getAsync(`downloading-${idPbl}`)
    while (cachedDown == 'true') {
      cachedDown = await cache.getAsync(`downloading-${idPbl}`)
      continue;
    }
    return new Promise((resolve, reject) => {
      let res = require(`../csv/${idPbl}.json`);
      resolve(res)
    })
  }
}


async function download(url, path) {
  const TIMEOUT = 100000
  const uri = parse(url)
  if (!path) {
    path = basename(uri.path)
  }
  let id = path
  path = `./csv/${path}_temp.csv`
  const file = fs.createWriteStream(path)

  return new Promise(function (resolve, reject) {
    const request = https.get(uri.href).on('response', function (res) {
      const len = parseInt(res.headers['content-length'], 10)
      let downloaded = 0
      res
        .on('data', function (chunk) {
          file.write(chunk)
          downloaded += chunk.length
          process.stdout.write(`Downloading ${downloaded} bytes\r`)
        })
        .on('end', function () {
          file.end()
          fs.rename(path, `./csv/${id}.csv`, function (err) {
            if (err) throw err;
            console.log('File Renamed.');
          });
          console.log(`${uri.path} downloaded to: ${path}`)
          resolve()
        })
        .on('error', function (err) {
          console.error(err)
          reject(err)
        })
    })

    request.setTimeout(TIMEOUT, function () {
      request.abort()
      reject(new Error(`request timeout after ${TIMEOUT / 1000.0}s`))
    })
  })
}

async function readCsv(id) {
  let path = `./csv/${id}.csv`
  return new Promise((resolve, reject) => {

    fs.createReadStream(path)
      .pipe(parseCsv({ delimiter: ',', from_line: 2, headers: true }))
      .on('data', function (csvrow) {
        // aqui mandar a vista cada row
        for (const element of arrObjetos) {
          if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase() == element) {
            objetos[0][element].push(csvrow)
          } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase() == element) {
            objetos[0][element].push(csvrow)
          } else if (csvrow[13].toLowerCase().includes(" " + element) || csvrow[13].toLowerCase() == element) {
            objetos[0][element].push(csvrow)
          }
        }
        if (csvrow[15] == 'Mobile') {
          objetos[0]['cell_phone'].push(csvrow)
        }
        if (csvrow[13] == 'Women Clothes') {
          for (const element of WomenClothes) {
            if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase().includes(element)) {
              objetos[1]['Women Clothes'][element].push(csvrow)
            } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase().includes(element)) {
              objetos[1]['Women Clothes'][element].push(csvrow)
            }
          }
        }
        if (csvrow[13] == 'Men Clothes') {
          for (const element of MenClothes) {
            if (csvrow[15].toLowerCase().includes(" " + element) || csvrow[15].toLowerCase().includes(element)) {
              objetos[1]['Men Clothes'][element].push(csvrow)
            } else if (csvrow[17].toLowerCase().includes(" " + element) || csvrow[17].toLowerCase().includes(element)) {
              objetos[1]['Men Clothes'][element].push(csvrow)
            }
          }
        }
      })
      .on('end', async function () {
        await fs.promises.writeFile(`./csv/${id}.json`, JSON.stringify(objetos, null, 2), 'utf-8');
        fs.unlinkSync(path)
        await cache.setAsync(`downloading-${id}`, false);
        console.log(`Done with shopee`)
        resolve(objetos)
      });
  })
}