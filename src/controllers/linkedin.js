const {
  postTextToPageFeed,
  singleImagePostToLinkedinPageFeed,
  multipleImagePostToLinkedinPageFeed,
  videoPostToLinkedinPageFeed,
} = require("../services/linkedinService");
const axios = require("axios");

/**
 * Handles the request to post text to a LinkedIn page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the LinkedIn API.
 */
exports.textPostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, postText } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !postText) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the postText to the page's feed
    const response = await postTextToPageFeed(accessToken, pageId, postText);

    // Return the response data from the LinkedIn API
    res.status(200).json(response);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a single image to a LinkedIn page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the LinkedIn API.
 */
exports.singleImagePostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const { accessToken, pageId, imageUrl, postText = "" } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !imageUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the postText to the page's feed
    const response = await singleImagePostToLinkedinPageFeed(
      accessToken,
      pageId,
      imageUrl,
      postText
    );

    // Return the response data from the LinkedIn API
    res.status(200).json(response);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post multiple images to a LinkedIn page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the LinkedIn API.
 */
exports.multipleImagePostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const {
      pageId, // The ID of the LinkedIn page.
      imageUrls, // The URLs of the images to be posted.
      postText = "", // The text to accompany the images.
      accessToken, // The access token for the user's LinkedIn page.
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !imageUrls) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Post the postText to the page's feed
    const response = await multipleImagePostToLinkedinPageFeed(
      accessToken,
      pageId,
      imageUrls,
      postText
    );

    // Return the response data from the LinkedIn API
    res.status(200).json(response);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Downloads a video from the given URL and returns it as a Buffer.
 *
 * @param {string} videoUrl - The URL of the video to be downloaded.
 * @return {Promise<Buffer>} A Promise that resolves to a Buffer containing the video data.
 */
const downloadVideo = async (videoUrl) => {
  // Make a GET request to the video URL and set the response type to "arraybuffer"
  const response = await axios.get(videoUrl, { responseType: "arraybuffer" });

  // Convert the response data to a Buffer and return it
  return Buffer.from(response.data, "binary");
};

/**
 * Handles the request to post a video to a LinkedIn page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the LinkedIn API.
 */
exports.videoPostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const {
      accessToken, // The access token for the user's LinkedIn page.
      pageId, // The ID of the page to which the video will be posted.
      videoUrl, // The URL of the video to be posted.
      postText = "", // The text to accompany the video.
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!accessToken || !pageId || !videoUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // Download the video
    const videoBuffer = await downloadVideo(videoUrl);

    // If the video download fails, return a bad request response
    if (!videoBuffer) {
      return res.status(400).json({ error: "Failed to download video" });
    }

    // Post the postText to the page's feed
    const response = await videoPostToLinkedinPageFeed(
      accessToken,
      pageId,
      videoBuffer,
      postText
    );

    // Return the response data from the LinkedIn API
    res.status(200).json(response);
  } catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};
