const express = require("express");
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const { appURL, apiUrl } = require("../config");
const axios = require("axios");
const { handleUserFacebookLoginSuccess } = require("../controllers/facebook");
// Initiate the Facebook authentication process
router.get("/facebook", passport.authenticate("facebook"));

const appUrlRdirect = appURL + "/publish";

// Handle the callback from Facebook
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: appUrlRdirect,
  }),
  async (req, res) => {
    await handleUserFacebookLoginSuccess(req.user);
    // res.send({ pagesData });
    res.redirect(appUrlRdirect);
  }
);

// Initiate the twitter authentication process
router.get("/twitter", passport.authenticate("twitter"));

// Handle the callback from Facebook
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get(
  "/twitter/callback",
  passport.authenticate("twitter", {
    successRedirect: appUrlRdirect,
    failureRedirect: appUrlRdirect,
  })
);

// Initiate the LinkedIn authentication process
router.get("/linkedin", (req, res) => {
  // Get the LinkedIn client ID and redirect URI from the environment variables
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = apiUrl + "/apis/auth/linkedin/callback";

  // Set the scope for the LinkedIn API
  const scope =
    "r_organization_followers r_organization_social rw_organization_admin r_organization_social_feed w_member_social w_organization_social r_basicprofile w_organization_social_feed w_member_social_feed r_1st_connections_size";

  // Generate a random state for the LinkedIn API
  const state = crypto.randomBytes(16).toString("hex");

  // Construct the authorization URL for LinkedIn
  const authorizationUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri
  )}&state=${state}&scope=${encodeURIComponent(scope)}`;

  // Redirect the user to the LinkedIn authorization URL
  res.redirect(authorizationUrl);
});

// Handle the callback from LinkedIn
router.get("/linkedin/callback", async (req, res) => {
  // Get the authorization code from the query parameters
  const { code } = req.query;

  // Get the LinkedIn client ID and client secret from the environment variables
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const clientSecret = process.env.LINKEDIN_CLIENT_SECRET;
  const redirectUri = apiUrl + "/apis/auth/linkedin/callback";

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      "https://www.linkedin.com/oauth/v2/accessToken",
      null,
      {
        params: {
          grant_type: "authorization_code",
          code: code,
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uri: redirectUri,
        },
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    // Extract the access token from the token response
    const { access_token } = tokenResponse.data;

    // Get the user information from the LinkedIn API
    const userInfoResponse = await axios.get("https://api.linkedin.com/v2/me", {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
      timeout: 30000,
    });

    // Get the user's pages from the LinkedIn API
    const pagesResponse = await axios.get(
      "https://api.linkedin.com/v2/organizationalEntityAcls",
      {
        params: {
          q: "roleAssignee",
        },
        headers: {
          Authorization: `Bearer ${access_token}`,
          "Linkedin-Version": "202406",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );

    // Log the user information and page data
    console.log({ user: userInfoResponse.data, pageData: pagesResponse.data });

    // TODO: Handle the user data here based on channel logic

    // Redirect the user to the main page
    res.redirect(appUrlRdirect);
  } catch (error) {
    // Log the error and send an error response
    console.log(322222, error);
    res.redirect(appUrlRdirect);
  }
});

module.exports = router;
