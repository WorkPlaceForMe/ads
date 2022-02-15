const db = require('../campaigns-db/database')
const Publishers = db.publishers;

let checkDuplicatePubl = (req, res, next) => {
  // Username
  Publishers.findOne({
    where: {
      name: req.body.name
    }
  }).then(user => {
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
  Publishers.findOne({
    where: {
      name: req.body.name
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