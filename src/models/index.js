// This file sets up the Sequelize ORM with the MySQL database and creates models for the User and UserChannels tables.

const { Sequelize, DataTypes } = require("sequelize");
const { mySql } = require("../config/index");

// Create a new Sequelize instance with the connection details from the config file.
const sequelize = new Sequelize(mySql.db, mySql.username, mySql.password, {
  dialect: "mysql",
  host: mySql.hostname,
  port: 3306,
});

// Create an empty object to store the models.
const db = {};

// Import the User model and pass the Sequelize instance and DataTypes to it.
db.User = require("./Users")(sequelize, DataTypes);

// Import the UserChannels model and pass the Sequelize instance and DataTypes to it.
db.UserChannels = require("./UserChannels")(sequelize, DataTypes);

// Add the Sequelize instance and Sequelize constructor to the db object.
db.sequelize = sequelize;
db.Sequelize = Sequelize;

// Uncomment the following block to sync the models with the database.
// This will drop and recreate all tables if they already exist.
// db.sequelize.sync({force: true}).then(() => {
//
//     console.log("syncing done");
//
// });

// Export the db object.
module.exports = db;
