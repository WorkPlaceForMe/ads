const Controller = require('../helper/controller')
const fs = require('fs').promises;

exports.version = Controller(async(req, res) => {
    try{
        const data = await fs.readFile("package.json", 'binary');
        const ver = JSON.parse(data).version
        res.status(200).json({success: true, version: ver})
    }catch(err){
        res.status(500).json({success: false, error: err})
    }
})