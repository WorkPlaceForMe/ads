const db = require('../helper/dbconnection')

 const auth = async function(site){
    const data = await enabled(site)
    let resp = {}
    if(data.length != 0){
        if(data[0].enabled == 'true'){
            resp['enabled'] = true
            resp['idP'] = data[0].publisherId
            resp['pages'] = data[0].pages
            return resp
        }else {
            resp['enabled'] = false
            return resp
        }   
    }else {
        resp['enabled'] = false
        return resp
    }
 };

 module.exports = auth;


const enabled = function(site){
 return new Promise(function(resolve, reject){
    db.query(`SELECT * from publishers where name ='${site}';`,  (error, elements)=>{
            if(error){
                return reject(error);
            }
            return resolve(elements);
        });
 });
}