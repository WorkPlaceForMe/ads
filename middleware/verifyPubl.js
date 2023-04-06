const db = require('../campaigns-db/database')
const Publishers = db.publishers;
const { getHostname } = require('../helper/util')

let checkDuplicatePubl = (req, res, next) => {
  let hostname = getHostname(req.body.name)
  
  Publishers.findOne({
    where: {
      hostname: hostname
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
  let hostname = getHostname(req.body.name)
  
  Publishers.findOne({
    where: {
      hostname: hostname
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