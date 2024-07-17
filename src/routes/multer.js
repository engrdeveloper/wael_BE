const multer = require("multer");
const path = require("path");

const fs = require("fs");

/**
 * ensureDirectoryExists - Ensures that a directory exists by creating it if necessary.
 * @param {string} directory - The directory path to ensure exists.
 * @returns {Promise<void>} - A Promise that resolves when the directory is created.
 */
async function ensureDirectoryExists(directory) {
  // Return a Promise that resolves when the directory is created
  return new Promise((resolve, reject) => {
    // Attempt to create the directory with the "recursive" option set to true
    fs.mkdir(directory, { recursive: true }, (err) => {
      // If there is an error, reject the Promise with the error
      if (err) {
        reject(err);
      } else {
        // If the directory is created successfully, resolve the Promise
        resolve();
      }
    });
  });
}

// Parent directory for uploads
const uploadDir = path.join(__dirname, "..", "..", "uploads");

// Ensure the upload directory exists
ensureDirectoryExists(uploadDir);

// Configure multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Replace spaces with hyphens in the filename
    const sanitizedFilename = file.originalname.replace(/\s+/g, "-");
    cb(null, `${Date.now()}-${sanitizedFilename}`);
  },
});

// Set up multer with file size limit and storage configuration
const uploadFile = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB file size limit
  fileFilter: (req, file, cb) => {
    // Optionally, you can add more file type validations here
    cb(null, true);
  },
});

module.exports = { uploadFile };