const express = require("express");
const router = express.Router();
const linkedinController = require("../controllers/linkedin");

// POST /page/post-text - send text post at the page
router.post("/page/post-text", linkedinController.textPostToPageFeed);

// POST /page/post-image - send image post at the page
router.post("/page/post-single-image", linkedinController.singleImagePostToPageFeed);

// POST /page/post-multiple-images - send image post at the page
router.post("/page/post-multiple-images", linkedinController.multipleImagePostToPageFeed);

// POST /page/post-video - send video post at the page
router.post("/page/post-video", linkedinController.videoPostToPageFeed);

module.exports = router;
