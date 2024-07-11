const express = require("express");
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const { appURL, apiUrl, twitterKey, twitterSecret } = require("../config");
const axios = require("axios");
const qs = require("qs");
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

const twitter_state = "YOUR_RANDOM_STATE_STRING";
const twitter_redirect_uri = apiUrl + "/apis/auth/twitter/callback";

// Generate a code verifier and code challenge for PKCE
const generateCodeVerifier = () => {
  return crypto.randomBytes(32).toString("base64url");
};

const generateCodeChallenge = (codeVerifier) => {
  return crypto.createHash("sha256").update(codeVerifier).digest("base64url");
};

const codeVerifier = generateCodeVerifier();
const codeChallenge = generateCodeChallenge(codeVerifier);

// Initiate the twitter authentication process
router.get("/twitter", (req, res) => {
  const scope = "tweet.read tweet.write users.read";

  // Construct the authorization URL
  const authUrl = `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=${twitterKey}&redirect_uri=${twitter_redirect_uri}&scope=${scope}&state=${twitter_state}&code_challenge=${codeChallenge}&code_challenge_method=S256`;
  res.redirect(authUrl);
});

// Handle the callback from twitter
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get("/twitter/callback", async (req, res) => {
  const { code, state: returnedState } = req.query;

  // Verify the state parameter for security
  if (twitter_state !== returnedState) {
    res.status(400).send("State parameter does not match");
    return;
  }

  // Exchange the authorization code for an access token
  const tokenData = qs.stringify({
    code: code,
    grant_type: "authorization_code",
    client_id: twitterKey,
    redirect_uri: twitter_redirect_uri,
    code_verifier: codeVerifier,
  });

  console.log("tokenData", tokenData);

  try {
    const tokenResponse = await axios.post(
      "https://api.twitter.com/2/oauth2/token",
      tokenData,
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        auth: { username: twitterKey, password: twitterSecret },
      }
    );

    res.send(tokenResponse.data);
    // Redirect the user to the main page
  } catch (error) {
    res
      .status(500)
      .send("Error exchanging authorization code for access token");
  }
});

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
