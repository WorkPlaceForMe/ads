const db = require('../campaigns-db/database')
const Publishers = db.publishers;
const { Op } = require("sequelize");

let checkDuplicatePubl = (req, res, next) => {
  // Username
  let name;
  if(req.body.name.startsWith("http")){
    name = req.body.name.split('http')[1]
    if(name.includes("www.")){
      name = name.split('www.')[1]
    }else{
      name = req.body.name.split('//')[1]
    }
  }else{
    if(req.body.name.startsWith("www.")){
      name = req.body.name.split('www.')[1]
    }else{
      name = req.body.name
    }
  }
  Publishers.findOne({
    where: {
      name: {
        [Op.substring]: name
      }
    }
  }).then(user => {
    console.log(user)
    if (user) {
      res.status(400).send({ success: false,
        repeated: 'name',
        message: "Failed! Website is already in use!"
      });
      return;
    }
      next();
    });
};

let checkDuplicatePublEdit = (req, res, next) => {
  // Username
  let name;
  if(req.body.name.startsWith("http")){
    name = req.body.name.split('http')[1]
    if(name.includes("www.")){
      name = name.split('www.')[1]
    }else{
      name = req.body.name.split('//')[1]
    }
  }else{
    if(req.body.name.startsWith("www.")){
      name = req.body.name.split('www.')[1]
    }else{
      name = req.body.name
    }
  }
  Publishers.findOne({
    where: {
      name: {
        [Op.substring]: name
      }
    }
  }).then(user => {
    if (user && user.dataValues.id != req.body.id) {
      res.status(400).send({ success: false,
        repeated: 'name',
        message: "Failed! Website is already in use!"
      });
      return;
    }
      next();
    });
};


const verifySignUp = {
  checkDuplicatePubl: checkDuplicatePubl,
  checkDuplicatePublEdit: checkDuplicatePublEdit
};

module.exports = verifySignUp;