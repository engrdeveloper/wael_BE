const axios = require("axios");
const { twitterKey, twitterSecret } = require("../config");
const crypto = require("crypto");
const uuidv4 = require("uuid").v4;

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
    // Construct the request body
    const body = { text };

    // Generate the OAuth header
    const authHeader = generateOAuthHeader({
      consumerKey: twitterKey,
      consumerSecret: twitterSecret,
      accessToken: accessToken,
      accessTokenSecret: accessTokenSecret,
      method: "POST",
      url: "https://api.twitter.com/2/tweets",
    });

    // Set up Axios configuration
    const config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://api.twitter.com/2/tweets",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      data: body,
    };

    // Make the request
    const response = await axios.request(config);

    // Send the response
    res.status(200).json({ success: true, data: response.data });
  } catch (error) {
    // Log the error and send the error response
    res.status(500).json({ success: false, error: error.message });
  }
};
