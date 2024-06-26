const mongoose = require('mongoose');
const {mongoDB} = require('../config');

mongoose.connect(
            `mongodb://${mongoDB.hostname}:27017/${mongoDB.db}`,
    {
        useNewUrlParser: true,
    }).then(res => {
    console.log('mongodb connected')
})
    .catch(error => {
        console.log('Cannot Connect To Mongo Database!', error);
    });

const Users = require('./Users');

module.exports = {
    Users
}