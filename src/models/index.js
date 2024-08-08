// This file sets up the Sequelize ORM with the MySQL database and creates models for the User and UserPages tables.

const { Sequelize, DataTypes } = require("sequelize");
const { mySql } = require("../config/index");

// Create a new Sequelize instance with the connection details from the config file.
const sequelize = new Sequelize(mySql.db, mySql.username, mySql.password, {
  dialect: "mysql",
  host: mySql.hostname,
  port: 3306,
});
7

// Create an empty object to store the models.
const db = {};

// Import the User model and pass the Sequelize instance and DataTypes to it.
db.User = require("./Users")(sequelize, DataTypes);

// Import the UserPages model and pass the Sequelize instance and DataTypes to it.
db.UserPages = require("./UserPages")(sequelize, DataTypes);

// Import the Page model and pass the Sequelize instance and DataTypes to it.
db.Pages = require("./Page")(sequelize, DataTypes);


// Import the Posts model and pass the Sequelize instance and DataTypes to it.
db.Posts = require("./Posts")(sequelize, DataTypes);

db.Subscriptions = require("./Subscriptions")(sequelize, DataTypes);


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

// db.Subscriptions.sync({force: true});

db.User.hasMany(db.Pages, {
  as: "mainUserPages",
  foreignKey: 'userId'
});

db.Pages.belongsTo(db.User, {
  as: "mainUserPages",
  foreignKey: 'userId'
});

db.User.belongsToMany(db.Pages, {
  through: "UserPages",
  as: "usersPages",
  foreignKey: 'userId'
});

db.Pages.belongsToMany(db.User, {
  through: "UserPages",
  as: "usersPages",
  foreignKey: 'pageId'
});

db.Pages.hasMany(db.Posts, {
  foreignKey: 'pageId'
})

db.Posts.belongsTo(db.Pages, {
  foreignKey: 'pageId'
})

// Export the db object.
module.exports = db;
