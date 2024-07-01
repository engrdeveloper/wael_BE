const express = require("express");
const router = express.Router();
const passport = require("passport");
const { appURL } = require("../config");
// Initiate the Facebook authentication process
router.get("/facebook", passport.authenticate("facebook"));

// Handle the callback from Facebook
// If authentication is successful, redirect to the main page
// If authentication fails, redirect to the login page
router.get(
  "/facebook/callback",
  passport.authenticate("facebook", {
    successRedirect: appURL,
    failureRedirect: appURL,
  })
);

module.exports = router;
