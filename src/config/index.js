require("dotenv").config();

module.exports = {
  hostname: process.env.server_url,
  appURL: process.env.APP_URL,
  apiUrl: process.env.REACT_APP_API_URL,
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
  facebookAppId: process.env.FACEBOOK_APP_ID,
  facebookAppSecret: process.env.FACEBOOK_APP_SECRET,
  linkedinAppId: process.env.LINKEDIN_APP_ID,
  linkedinAppSecret: process.env.LINKEDIN_APP_SECRET,
  twitterKey: process.env.TWITTER_KEY,
  twitterSecret: process.env.TWITTER_SECRET,
};
