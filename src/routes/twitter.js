const express = require("express");
const router = express.Router();

const twitterController = require("../controllers/twitter");

// POST /twitter/post-text-tweet - send text tweet to twitter account
router.post("/post-text-tweet", twitterController.postTextTweetToTwitter);

module.exports = router;
