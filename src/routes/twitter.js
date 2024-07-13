const express = require("express");
const router = express.Router();

const twitterController = require("../controllers/twitter");

// POST /twitter/post-text-tweet - send text tweet to twitter account
router.post("/post-text-tweet", twitterController.postTextTweetToTwitter);

// POST /twitter/post-image-tweet - send image tweet to twitter account
router.post("/post-image-tweet", twitterController.postImageTweetToTwitter);

module.exports = router;
