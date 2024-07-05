// Set up Passport.js for Facebook authentication
const passport = require("passport");
const {
  facebookAppId,
  facebookAppSecret,
  apiUrl,
  twitterKey,
  twitterSecret,
} = require("../config");
const FacebookStrategy = require("passport-facebook").Strategy;
const TwitterStrategy = require("passport-twitter").Strategy;

// Facebook permissions required for posting to a page:
// https://developers.facebook.com/docs/pages-api/posts/
// - pages_manage_engagement
// - pages_manage_posts
// - pages_read_engagement
// - pages_read_user_engagement
// - publish_video (if you're publishing a video to the Page)

// pages_manage_engagement depends on:https://developers.facebook.com/docs/permissions/#permission-dependencies
// - pages_read_user_content
// - pages_show_list

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
        "publish_video",
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

// Configure Passport.js to use the Twitter strategy
passport.use(
  new TwitterStrategy(
    {
      consumerKey: twitterKey,
      consumerSecret: twitterSecret,
      callbackURL: `${apiUrl}/apis/auth/twitter/callback`,
    },
    function (token, tokenSecret, profile, done) {
      console.log(profile, 444444444444);
      // In a real application, you might save the profile info to a database
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
