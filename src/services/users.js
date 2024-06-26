let {Users} = require('../models'); // this can be any DB model

exports.getAllData = async () => {
    return Users.find()
}

