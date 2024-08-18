const express = require("express");
const router = express.Router();
const { auth, checkSubscription } = require('../middlewares/auth')
const facebookController = require("../controllers/facebook");
const multer = require("multer");
const path = require('path');
const { apiUrl } = require('../config')

const storage = multer.diskStorage({
  destination: './uploads/',
  filename: function (req, file, cb) {
    cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
  }
});

// Initialize upload variable
const upload = multer({
  storage: storage,
  limits: { fileSize: 10000000 }, // 10MB file size limit
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
}); // 'myFile' is the name attribute of the file input field

// Check file type
function checkFileType(file, cb) {
  // Allowed ext
  const filetypes = /jpeg|jpg|png|gif|mp4|bmp|tiff/;
  // Check ext
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  // Check mime
  const mimetype = filetypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  }
  else {
    cb('Error: Images Only!');
  }
}

// POST /page/post-text 36366- send text post at the page
router.post("/page/post-text", auth, checkSubscription, facebookController.textPostToPageFeed);

// POST /page/post-single-image - send single image post at the page
router.post(
  "/page/post-single-image",
  auth,
  checkSubscription,
  facebookController.singleImagePostToPageFeed
);

// POST /page/post-multiple-images - send multiple image post at the page
router.post(
  "/page/post-multiple-images",
  auth,
  checkSubscription,
  facebookController.multipleImagePostToPageFeed
);

// POST /page/post-video - send video post at the page
router.post("/page/post-video", auth, checkSubscription, facebookController.videoPostToPageFeed);

// POST /page/post-reel - send reel post at the page
router.post("/page/post-reel", auth, checkSubscription, facebookController.reelPostToPageFeed);

// POST /page/post-story - send story post at the page
router.post("/page/post-story-video", auth, checkSubscription, facebookController.storyVideoToPageFeed);

// POST /page/post-story-image - send story image post at the page
router.post("/page/post-story-image", auth, checkSubscription, facebookController.storyImageToPageFeed);

// Single file upload route
router.post('/upload-single', upload.single('file'), (req, res) => {
  if (req.file === undefined) {
    res.status(400).json({ message: 'No file selected!' });
  }
  else {
    res.status(200).json({
      message: 'File uploaded successfully!',
      file: `${ apiUrl }/apis/uploads/${ req.file.filename }`
    });
  }
});

// Multiple file upload route
router.post('/upload-multiple', upload.array('files', 5), (req, res) => { // 'myFiles' is the name attribute, 5 is the max number of files
  if (req.files === undefined || req.files.length === 0) {
    res.status(400).json({ message: 'No files selected!' });
  }
  else {
    let fileList = req.files.map(file => `uploads/${ file.filename }`);
    res.status(200).json({ message: 'Files uploaded successfully!', files: fileList });
  }
});

module.exports = router;
