const express = require("express");
const router = express.Router();
const linkedinController = require("../controllers/linkedin");
const { auth } = require('../middlewares/auth')

// POST /page/post-text - send text post at the page
router.post("/page/post-text", auth, linkedinController.textPostToPageFeed);

// POST /page/post-image - send image post at the page
router.post("/page/post-single-image", auth, linkedinController.singleImagePostToPageFeed);

// POST /page/post-multiple-images - send image post at the page
router.post("/page/post-multiple-images", auth, linkedinController.multipleImagePostToPageFeed);

// POST /page/post-video - send video post at the page
router.post("/page/post-video", auth, linkedinController.videoPostToPageFeed);

module.exports = router;
