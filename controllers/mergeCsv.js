const http = require('http');
const fs = require('fs');
const conf = require('../middleware/prop')
const path = './csv/file.csv' // where to save a file
const jwt = require('jsonwebtoken')
const init = require('./affiliate')
const axios = require('axios')

exports.mergeCsv = async (req,res) => {
    await init.getAff.then(async function(creds){
    let siteUrls = [];
    let csvFiles = [];
    const siteId = 48475
    const ids = {
        lazada: 520,
        trueShopping: 594,
        shopee: 677,
        rabbitFinanceA: 720,
        kkpPersonalLoan: 710,
        rabbitFinanceB: 708,
        nanmeeBooks: 692,
        fitbit: 687,
        taradDotCom: 675,
        zwizAI: 638,
        promotionsMoney: 709,
        jorakayOnline: 645,
        agoda: 721,
        newTopsOnline: 704,
        gscAsset: 701,
        monteCarloTailors: 700,
        cignaSmartHealth: 685,
        cignaPA: 684,
        cignaSuperPlan: 683,
        allAboutYou: 666,
        tripDotCom: 535,
        accessTrade: 660
    }

    for (const affId in ids) {
        const affiliateEndpoint = `${conf.get('accesstrade_endpoint')}/v1/publishers/me/sites/${siteId}/campaigns/${ids[affId]}/productfeed/url`
        const token = jwt.sign(
            { sub: creds.userUid },
            creds.secretKey,
            {
                algorithm: "HS256"
            }
        )

        try {
            console.log("SUCCESS!1")
            const affiliateResponse = await axios.get(affiliateEndpoint, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Accesstrade-User-Type': 'publisher'
                }
            })
            // Success response for requesting the affiliate API
            console.log("SUCCESS!2")
            console.log(affiliateResponse.data.baseUrl)
            const url = affiliateResponse.data.baseUrl; // link to file you want to download
            // console.log(affiliateResponse.data.baseUrl);
            const request = await axios.get(url, function (response) {
                console.log("!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!")
                console.log(response)
                if (response.statusCode === 200) {
                    
                    var file = fs.createWriteStream(path);
                    response.pipe(file);
                    // console.log(file)
                }
                request.setTimeout(10000, function () { // if after 60s file not downlaoded, we abort a request 
                    request.destroy();
                    console.log(response)
                })
            });
            console.log("SUCCESS!!!!!")
            // resultsAffiliate.push(obj)

        } catch (err) {
            // Error handler after the request to the API
            // resultsAffiliate.push(obj)
            console.log("ERROR")
            // console.error(err.response)
        }
    }
}
    )}

