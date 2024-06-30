require("dotenv").config();

module.exports = {
  mySql: {
    hostname: process.env.HOSTNAME,
    username: process.env.USERNAME,
    dB: process.env.DB,
    port: process.env.PORT,
    password: process.env.PASSWORD,
  },
  port: process.env.PORT || 4000
};
