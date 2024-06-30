const {Sequelize, DataTypes} = require('sequelize');
const {mySql} = require('../config/index')

const sequelize = new Sequelize(mySql.db, mySql.username, mySql.password, {
    dialect: 'mysql',
    host: mySql.hostname,
    port: 3306
});

const db = {};

db.User = require('./Users')(sequelize, DataTypes);
db.UserChannels = require('./UserChannels')(sequelize, DataTypes);

db.sequelize = sequelize;
db.Sequelize = Sequelize;

// db.sequelize.sync({force: true}).then(() => {
//
//     console.log("syncing done");
//
// });

module.exports = db;
