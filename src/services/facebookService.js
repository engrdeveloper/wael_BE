const axios = require("axios");
const FormData = require("form-data");

/**
 * Text Post To FB Page Feed
 *
 * Posts a text message to a Facebook page's feed.
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the message will be posted.
 * @param {string} message - The message to be posted.
 * @returns {Object} - An object contain response data from the Facebook API.
 * @throws {Error} - If there is an error while posting to Facebook.
 */
const textPostToFbPageFeed = async ({ accessToken, pageId, message }) => {
  try {
    // Make a POST request to the Facebook Graph API to post a message to the page's feed.
    const response = await axios.post(
      `https://graph.facebook.com/${pageId}/feed`,
      {
        message,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Single Image Post To FB Page Feed
 *
 * Posts a single image message to a Facebook page's feed.
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the message will be posted.
 * @param {string} imageUrl - The URL of the image to be posted.
 * @param {string} [caption] - The optional caption for the image.
 * @returns {Object} - An object contain response data from the Facebook API.
 * @throws {Error} - If there is an error while posting to Facebook.
 */
const singleImagePostToFbPageFeed = async ({
  accessToken,
  pageId,
  imageUrl,
  caption = "",
}) => {
  try {
    // Make a POST request to the Facebook Graph API to post a single image to the page's feed.
    const response = await axios.post(
      `https://graph.facebook.com/${pageId}/photos`,
      {
        url: imageUrl,
        caption,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Handle Error
 *
 * Handles the error that occurs while posting to Facebook.
 * @param {Error} error - The error that occurred.
 * @throws {Error} - Throw the same error that occurred.
 */
const handleError = (error) => {
  console.log("Error while posting to facebook", error.response.data);
  throw new Error(error);
};

/**
 * Multiple Image Post To FB Page Feed
 *
 * Posts multiple images to a Facebook page's feed.
 * @param {string} [message=""] - The message to be posted.
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the message will be posted.
 * @param {Array<string>} imageUrls - The URLs of the images to be posted.
 * @returns {Promise<Object>} - A promise that resolves to the response data from the Facebook API.
 * @throws {Error} - Throws an error if there is an error while posting to Facebook.
 */
const multipleImagePostToFbPageFeed = async ({
  message = "",
  accessToken,
  pageId,
  imageUrls,
}) => {
  try {
    // Get the image IDs for each image URL
    const imageIds = await Promise.all(
      imageUrls.map(async (imageUrl) => {
        // Make a POST request to get the image ID
        const response = await axios.post(
          `https://graph.facebook.com/${pageId}/photos`,
          {
            url: imageUrl,
            published: false, // Get the image ID without publishing
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${accessToken}`,
            },
          }
        );
        return response.data.id; // Return the image ID
      })
    );

    // Create an array of objects with the image IDs
    const attachedMedia = imageIds.map((id) => ({ media_fbid: id }));

    // Make a POST request to post the message and the attached media
    const response = await axios.post(
      `https://graph.facebook.com/${pageId}/feed`,
      {
        message,
        attached_media: attachedMedia,
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    console.log(222222, error);
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

/**
 * Posts a video to a Facebook page's feed.
 *
 * @param {string} accessToken - The access token for the user's Facebook Page.
 * @param {string} pageId - The ID of the page to which the video will be posted.
 * @param {string} videoUrl - The URL of the video to be posted.
 * @param {string} [description=""] - The optional description for the video.
 * @returns {Object} - An object contain response data from the Facebook API.
 * @throws {Error} - Throws an error if there is an error while posting to Facebook.
 */
const videoPostToFbPageFeed = async ({
  accessToken,
  pageId,
  videoUrl,
  description = "",
}) => {
  try {
    // Create a FormData object to hold the video data
    let data = new FormData();
    data.append("access_token", accessToken); // Append the access token
    data.append("file_url", videoUrl); // Append the video URL
    data.append("description", description); // Append the description (if provided)

    // Set up the request configuration
    let config = {
      method: "post",
      url: `https://graph.facebook.com/${pageId}/videos`, // Construct the URL with the page ID
      data: data, // Set the FormData object as the request data
    };

    // Make the request to post the video to the Facebook Graph API
    const response = await axios.request(config);

    // Return the response data from the Facebook API.
    return response.data;
  } catch (error) {
    // Handle any errors that occur while posting to Facebook.
    handleError(error);
  }
};

module.exports = {
  textPostToFbPageFeed,
  singleImagePostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
};
