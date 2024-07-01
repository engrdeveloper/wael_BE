// Set up Passport.js for Facebook authentication
const passport = require("passport");
const { facebookAppId, facebookAppSecret, apiUrl } = require("../config");
const FacebookStrategy = require("passport-facebook").Strategy;

// Configure Passport.js to use the Facebook strategy
passport.use(
  new FacebookStrategy(
    {
      // Use the Facebook App ID and App Secret from the config file
      clientID: facebookAppId,
      clientSecret: facebookAppSecret,
      // Set the callback URL for Facebook authentication
      callbackURL: `${apiUrl}/apis/auth/facebook/callback`,
      // Specify the permissions we're requesting from the user
      scope: [
        "email",
        "instagram_basic",
        "business_management",
        "instagram_content_publish",
        "public_profile",
        "pages_manage_posts",
        "pages_show_list",
        "pages_read_engagement",
        "pages_manage_engagement",
        "pages_read_user_content",
      ],
    },
    // This function is called after Facebook authentication is successful
    function (accessToken, refreshToken, profile, done) {
      // Here, you can use the profile info (mainly profile id) to check if the user is registered in your db
      // and decide whether to create a new user or return the existing user.
      profile.accessToken = accessToken;
      return done(null, profile);
    }
  )
);

// Serialize the user object into a session
passport.serializeUser((user, done) => {
  done(null, user);
});

// Deserialize the user object from a session
passport.deserializeUser((obj, done) => {
  done(null, obj);
});
