const express = require("express");
const router = express.Router();

const twitterController = require("../controllers/mainTwitter");
const { auth, checkSubscription } = require('../middlewares/auth');

// POST /twitter/post-text-tweet - send text tweet to twitter account
router.post("/post-text-tweet", auth, checkSubscription, twitterController.postTextTweetToTwitter);

// POST /twitter/post-image-tweet - send image tweet to twitter account
router.post("/post-image-tweet", auth, checkSubscription, twitterController.postImageTweetToTwitter);

// POST /twitter/post-carousel-tweet - send carousel tweet to twitter account
router.post("/post-carousel-tweet", auth, checkSubscription, twitterController.postCarouselTweetToTwitter);

// POST /twitter/post-video-tweet - send video tweet to twitter account
router.post("/post-video-tweet", auth, checkSubscription, twitterController.postVideoTweetToTwitter);

module.exports = router;
