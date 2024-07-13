const axios = require("axios");
const { twitterKey, twitterSecret } = require("../config");
const crypto = require("crypto");
const uuidv4 = require("uuid").v4;
const fs = require("fs");
const path = require("path");

const { TwitterApi } = require("twitter-api-v2");

const twitterApiClient = (accessToken, accessTokenSecret) => {
  return new TwitterApi({
    appKey: twitterKey,
    appSecret: twitterSecret,
    accessToken: accessToken,
    accessSecret: accessTokenSecret,
  });
};

// Sample to test generate oauth header
// // Generate the OAuth header
// const authHeader = generateOAuthHeader({
//   consumerKey: twitterKey,
//   consumerSecret: twitterSecret,
//   accessToken: accessToken,
//   accessTokenSecret: accessTokenSecret,
//   method: "POST",
//   url: "https://api.twitter.com/2/tweets",
// });

// // Set up Axios configuration
// const config = {
//   method: "post",
//   maxBodyLength: Infinity,
//   url: "https://api.twitter.com/2/tweets",
//   headers: {
//     "Content-Type": "application/json",
//     Authorization: authHeader,
//   },
//   data: body,
// };

/**
 * Generates an OAuth header for a Twitter API request.
 *
 * @param {string} consumerKey - Twitter API consumer key.
 * @param {string} consumerSecret - Twitter API consumer secret.
 * @param {string} accessToken - Twitter API access token.
 * @param {string} accessTokenSecret - Twitter API access token secret.
 * @param {string} method - HTTP method of the request.
 * @param {string} url - URL of the request.
 * @return {string} OAuth header.
 */
const generateOAuthHeader = ({
  consumerKey,
  consumerSecret,
  accessToken,
  accessTokenSecret,
  method,
  url,
}) => {
  // Generate the random nonce and timestamp
  const oauthTimestamp = Math.floor(Date.now() / 1000);
  const oauthNonce = uuidv4();

  // Construct the OAuth parameters
  const parameters = {
    oauth_consumer_key: consumerKey,
    oauth_token: accessToken,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: oauthTimestamp,
    oauth_nonce: oauthNonce,
    oauth_version: "1.0",
  };

  // Sort the parameters and encode them
  let ordered = {};
  Object.keys(parameters)
    .sort()
    .forEach(function (key) {
      ordered[key] = parameters[key];
    });

  let encodedParameters = "";
  for (let k in ordered) {
    const encodedValue = encodeURIComponent(ordered[k]);
    const encodedKey = encodeURIComponent(k);
    if (encodedParameters === "") {
      encodedParameters += `${encodedKey}=${encodedValue}`;
    } else {
      encodedParameters += `&${encodedKey}=${encodedValue}`;
    }
  }

  // Construct the signature base string
  const encodedUrl = encodeURIComponent(url);
  const encodedParams = encodeURIComponent(encodedParameters);
  const signatureBaseString = `${method.toUpperCase()}&${encodedUrl}&${encodedParams}`;

  // Generate the OAuth signature
  const signingKey = `${encodeURIComponent(
    consumerSecret
  )}&${encodeURIComponent(accessTokenSecret)}`;
  const oauthSignature = crypto
    .createHmac("sha1", signingKey)
    .update(signatureBaseString)
    .digest("base64");
  const encodedOAuthSignature = encodeURIComponent(oauthSignature);

  // Construct the OAuth header
  const authHeader = `OAuth oauth_consumer_key="${parameters.oauth_consumer_key}",oauth_token="${parameters.oauth_token}",oauth_signature_method="HMAC-SHA1",oauth_timestamp="${parameters.oauth_timestamp}",oauth_nonce="${parameters.oauth_nonce}",oauth_version="1.0",oauth_signature="${encodedOAuthSignature}"`;

  return authHeader;
};

/**
 * Posts a text tweet to the Twitter account associated with the provided access token and access token secret.
 *
 * @param {Object} req - The request object containing the text of the tweet, access token, and access token secret.
 * @param {Object} res - The response object.
 * @returns {Promise<void>} - A promise that resolves when the tweet is posted successfully.
 */
exports.postTextTweetToTwitter = async (req, res) => {
  // Destructure the request body
  const { text, accessToken, accessTokenSecret } = req.body;

  // Check if all required parameters are present
  if (!text || !accessToken || !accessTokenSecret) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Instantiate the Twitter API client
    const client = twitterApiClient(accessToken, accessTokenSecret);

    // Make the request
    const response = await client.v2.tweet({ text });

    // Send the response
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    // Log the error and send the error response
    res
      .status(500)
      .json({ success: false, error: error?.message, reason: error?.data });
  }
};

async function downloadImage(url, filePath) {
  const response = await axios({
    url,
    responseType: "stream",
  });

  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);
    writer.on("finish", resolve);
    writer.on("error", reject);
  });
}

/**
 * Checks if the given directory exists, and creates it if it does not exist.
 *
 * @param {string} directory - The directory path to check and create.
 * @returns {Promise} - A Promise that resolves when the directory is created.
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

/**
 * Handles the request to post an image tweet to Twitter.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Twitter API.
 */
exports.postImageTweetToTwitter = async (req, res) => {
  // Destructure the request body
  const { text, imageUrl, accessToken, accessTokenSecret } = req.body;

  // Check if all required parameters are present
  if (!text || !imageUrl || !accessToken || !accessTokenSecret) {
    return res.status(400).json({ error: "Missing required parameters" });
  }

  try {
    // Create the assets directory if it doesn't exist
    const assetsPath = path.join(__dirname, "..", "assets");
    await ensureDirectoryExists(assetsPath);

    // Set the file path for the downloaded image
    const filePath = path.resolve(assetsPath, "twitter_image.jpg");

    // Download the image from the provided URL
    await downloadImage(imageUrl, filePath);

    // Instantiate the Twitter API client
    const client = twitterApiClient(accessToken, accessTokenSecret);

    // Upload the image to Twitter and get the media ID
    const mediaId = await client.v1.uploadMedia(filePath);

    // Make the request to post the tweet with the image
    const response = await client.v2.tweet({
      text,
      media: {
        media_ids: [mediaId],
      },
    });

    // Send the response
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    // Log the error and send the error response
    res
      .status(500)
      .json({ success: false, error: error.message, reason: error?.data });
  }
};
