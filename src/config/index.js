require("dotenv").config();

module.exports = {
  mongoDB: {
    hostname: process.env.HOSTNAME,
    db: process.env.DB,
  },
  port: process.env.PORT || 4000
};
