const express = require("express");
const router = express.Router();
const passport = require("passport");
const crypto = require("crypto");
const { appURL, apiUrl } = require("../config");
const axios = require("axios");
const { handleUserFacebookLoginSuccess, getLongLivedPageToken } = require("../controllers/facebook");
const { addPage } = require('../services/pages')
const { addUserPage } = require('../services/userPages')
const axiosRetry = require("axios-retry").default;
axiosRetry(axios, { retries: 3, retryDelay: axiosRetry.exponentialDelay });

// Initiate the Facebook authentication process

router.get("/facebook", ((req, res, next) => {

  const user = req.query.myVar

  passport.authenticate("facebook", {
    state: user
  })(req, res, next)

}));

const appUrlRdirect = appURL + "/publish/all";

// Handle the callback from Facebook
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    failureRedirect: appUrlRdirect
  }),
  async (req, res) => {
    try {

      const pagesData = await handleUserFacebookLoginSuccess(req.user);

      if (Array.isArray(pagesData) && pagesData.length > 0) {

        for (let i = 0; i < pagesData.length; i++) {

          const page = pagesData[i]
          // const longToken = await getLongLivedPageToken(page?.access_token, page?.id)

          if (page?.instagram_business_account?.id) {
            const channel = await addPage(page?.instagram_business_account?.id, page?.access_token, page?.instagram_business_account?.details.name || page?.name, req.user.accessToken, req?.user?.userSqlId, 'instagram')
            if (Array.isArray(channel)) {
              if (channel[1] === true) {
                const channelUser = await addUserPage(req?.user?.userSqlId, 'owner', channel[0]?.dataValues.id)
              }
            }
          }

          const channel = await addPage(page?.id, page?.access_token, page?.name, req.user.accessToken, req?.user?.userSqlId, 'facebook')

          if (Array.isArray(channel)) {
            if (channel[1] === true) {
              const channelUser = await addUserPage(req?.user?.userSqlId, 'owner', channel[0]?.dataValues.id)
            }
          }

        }

      }

      // res.send({pagesData});
      res.redirect(appUrlRdirect);
    }
    catch (e) {
      console.log('error while signing up', e.message)
      return res.status(500).json({
        success: false,
        error: { message: 'Error while signing up to facebook', reason: e.message }
      })
    }
  }
);

// Initiate the twitter authentication process
router.get("/twitter", ((req, res, next) => {

  const user = req.query.myVar

  console.log(user)

  passport.authenticate("twitter", {
    state: user
  })(req, res, next)

}));

// Handle the callback from twitter
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get(
  "/twitter/callback",
  passport.authenticate("twitter"),
  async (req, res) => {
    const profile = req.user;

    const channel = await addPage(profile?.id, `${ profile?.access_token }@${ profile?.tokenSecret }`, profile.displayName, req.user.accessToken, req?.user?.userSqlId, 'twitter')

    if (Array.isArray(channel)) {
      if (channel[1] === true) {
        const channelUser = await addUserPage(req?.user?.userSqlId, 'owner', channel[0]?.dataValues.id)
      }
    }

    res.redirect(appUrlRdirect);


    // res.send({
    //   id: profile.id,
    //   username: profile.username,
    //   displayName: profile.displayName,
    //   token: profile.token,
    //   tokenSecret: profile.tokenSecret,
    // });
  }
);

// Initiate the LinkedIn authentication process
router.get("/linkedin", (req, res) => {
  // Get the LinkedIn client ID and redirect URI from the environment variables
  const clientId = process.env.LINKEDIN_CLIENT_ID;
  const redirectUri = apiUrl + "/apis/auth/linkedin/callback";

  // Set the scope for the LinkedIn API
  const scope =
    "r_organization_followers r_organization_social rw_organization_admin r_organization_social_feed w_member_social w_organization_social r_basicprofile w_organization_social_feed w_member_social_feed r_1st_connections_size";

  const user = req.query.myVar

  console.log(user)

  // Construct the authorization URL for LinkedIn
  const authorizationUrl = `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${ clientId }&redirect_uri=${ encodeURIComponent(
    redirectUri
  ) }&state=${ user }&scope=${ encodeURIComponent(scope) }`;

  // Redirect the user to the LinkedIn authorization URL
  res.redirect(authorizationUrl);
});

// Handle the callback from LinkedIn
router.get("/linkedin/callback", async (req, res) => {
  // Get the authorization code from the query parameters
  const { code, state } = req.query;

  console.log('hello world', req.query, req.params)

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
        Authorization: `Bearer ${ access_token }`,
      },
      timeout: 30000,
    });
    console.log(access_token)
    // Get the user's pages from the LinkedIn API
    const pagesResponse = await axios.get(
      "https://api.linkedin.com/v2/organizationalEntityAcls",
      {
        params: {
          q: "roleAssignee",
        },
        headers: {
          Authorization: `Bearer ${ access_token }`,
          "Linkedin-Version": "202406",
          "X-Restli-Protocol-Version": "2.0.0",
        },
      }
    );


    for (let i = 0; i < pagesResponse?.data?.elements.length; i++) {

      const page = pagesResponse.data.elements[i]

      console.log(page?.organizationalTarget?.split(':')?.[3], 'lllllllllllllllll')

      if (page?.organizationalTarget?.split(':')?.[3]) {

        const name = await axios.get(`https://api.linkedin.com/rest/organizations/${ page?.organizationalTarget?.split(':')?.[3] }`,
          {
            headers: {
              Authorization: `Bearer ${ access_token }`,
              "Linkedin-Version": "202406",
              "X-Restli-Protocol-Version": "2.0.0",
            },
          }
        )

        console.log(name?.data?.localizedName, 'i am gere ali awan')

        const channel = await addPage(page?.organizationalTarget?.split(':')?.[3], access_token, name?.data?.localizedName, null, state, 'linkedin')

        console.log(channel, 'kekekekekekeke')

        if (Array.isArray(channel)) {
          if (channel[1] === true) {
            console.log('i am hfhfhf')
            const channelUser =
              await addUserPage(state, 'owner', channel[0]?.dataValues.id)
          }
        }
      }
    }

    console.log('comp;eyted')


    // Log the user information and page data
    // console.log({ user: userInfoResponse.data, pageData: pagesResponse.data });

    // TODO: Handle the user data here based on channel logic

    // Redirect the user to the main page

    // Redirect the user to the main page
    res.redirect(appUrlRdirect);
    // res.send({ user: userInfoResponse.data, pageData: pagesResponse.data });
  }
  catch (error) {
    // Log the error and send an error response
    res.redirect(appUrlRdirect);
  }
});

module.exports = router;
