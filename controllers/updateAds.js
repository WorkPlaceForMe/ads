const Controller = require('../helper/controller')
const db1 = require('../campaigns-db/database')
const publishers = db1.publishers
const cache = require('../helper/cacheManager')

exports.updateAds = Controller(async(req, res) => {
    const data = req.body
    // const publ = await check(req.params.id)
    // for(const ext of Object.keys(data[0])){
    //     if(data[0][ext] != publ.pages[0][ext] || data[1][ext] != publ.pages[1][ext]){
    //         // await scanAll(`${ext}:*`)
    //         // await delRedis(`${ext}:*`,100)

    //         scan(`${ext}:*`,function(){
    //             console.log('Scan Complete');
    //         });
    //     }
    // }
    await update(data,req.params.id)
    await cache.cleardb()

    res.status(200).json({success: true});
})

async function update(body,id) {
    const publ = await publishers.findOne({
        where: { name: id },
    })
    await publ.update({pages: body})
    return publ
}

async function check(id) {
    const publ = await publishers.findOne({
        where: { name: id },
    })
    return publ
}

async function delRedis(matchClear, count){
    let localKeys = [];
    let promises = []
    console.log(matchClear,`'${matchClear}'`)
    const match = { match: `'${matchClear}'`, count: count}
    cache.scandb(0, 'MATCH', matchClear).on('data', async function (resultKeys) {
    console.log("Data Received", localKeys.length, localKeys);
    for (var i = 0; i < resultKeys.length; i++) {
        localKeys.push(resultKeys[i]);
        promises.push(cache.clear(resultKeys[i]))
    }
    if(localKeys.length > count){
        await Promise.all(promises)
        console.log("one batch delete complete")
        localKeys=[];
        promises = []
    }
    });
    cache.scandb(0, 'MATCH', matchClear).on('end', async function(){
        await Promise.all(promises)
        console.log("one batch delete complete")
    });
    cache.scandb(0, 'MATCH', matchClear).on('error', function(err){
    console.log("error", err)
    })
}

const scanAll = async (pattern) => {
  const found = [];
  let cursor = '0';

  do {
    const reply = await cache.scandb(cursor, 'MATCH', pattern);
    console.log(reply, pattern)
    cursor = reply[0];
    found.push(...reply[1]);
  } while (cursor !== '0');

  return found;
}

var cursor = '0';
function scan(pattern,callback){
    console.log(pattern)
    cache.scandb(cursor, 'MATCH',pattern, function(err, reply){
        if(err){
            console.error(err,'==============');
        }
        console.log(reply)
        cursor = reply[0];
        if(cursor === '0'){
            return callback();
        }else{

            var keys = reply[1];
            keys.forEach(function(key,i){                   
                cache.clear(key, function(deleteErr, deleteSuccess){
                    console.log(key);
                });
            });
            return scan(pattern,callback);
        }
    });
}
