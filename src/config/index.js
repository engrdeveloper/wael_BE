require("dotenv").config();

module.exports = {
  hostname: process.env.server_url,
  mySql: {
    hostname: process.env.HOSTNAME,
    username: process.env.USERNAME,
    db: process.env.DB,
    port: process.env.PORT,
    password: process.env.PASSWORD,
  },
  port: process.env.PORT || 4000,
  emailService: {
    user: process.env.emailUser,
    pass: process.env.emailPass,
    from: process.env.fromEmail,
  },
};
