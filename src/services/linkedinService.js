const axios = require("axios");
const FormData = require("form-data");
const axiosRetry = require("axios-retry").default;
axiosRetry(axios, { retries: 5, retryDelay: axiosRetry.exponentialDelay });

/**
 * Method to post text content to a LinkedIn page.
 * @param userPageToken - Access token for the user's LinkedIn page.
 * @param pageId - The ID of the LinkedIn page.
 * @param textContent - Text content to post.
 * @returns The response data from the LinkedIn API.
 */
exports.postTextToPageFeed = async (userPageToken, pageId, textContent) => {
  try {
    // Post the text content to the page's feed
    const response = await axios.post(
      "https://api.linkedin.com/rest/posts",
      {
        author: `urn:li:organization:${pageId}`,
        commentary: textContent,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      },
      {
        headers: {
          Authorization: `Bearer ${userPageToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 10000,
      }
    );

    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Error posting text content: ${
        error.response ? error.response.data : error.message
      }`
    );
  }
};

/**
 * Method to download an image from a URL.
 * @param imageUrl - URL of the image to download.
 * @returns A buffer containing the image data.
 */
const downloadImage = async (imageUrl) => {
  const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
  return Buffer.from(response.data, "binary");
};

/**
 * Method to post an image to a LinkedIn page.
 * @param userPageToken - Access token for the user's LinkedIn page.
 * @param pageId - The ID of the LinkedIn page.
 * @param imagePath - Path to the image to post.
 * @param comment - Comment for the image.
 * @returns The response data from the LinkedIn API.
 */
exports.singleImagePostToLinkedinPageFeed = async (
  userPageToken,
  pageId,
  imagePath,
  comment
) => {
  try {
    const registerUploadResponse = await axios.post(
      `https://api.linkedin.com/rest/images?action=initializeUpload`,
      {
        initializeUploadRequest: {
          owner: `urn:li:organization:${pageId}`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userPageToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 10000,
      }
    );

    const uploadUrl = registerUploadResponse.data.value.uploadUrl;
    const asset = registerUploadResponse.data.value.image;
    const imageData = await downloadImage(imagePath);

    const form = new FormData();
    form.append("file", imageData, "image.jpg");

    await axios.post(uploadUrl, form, {
      headers: {
        ...form.getHeaders(),
        "Linkedin-Version": "202405",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeout: 10000,
    });

    const postResponse = await axios.post(
      "https://api.linkedin.com/rest/posts",
      {
        author: `urn:li:organization:${pageId}`,
        commentary: comment,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            altText: "testing for alt tags",
            id: asset,
          },
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      },
      {
        headers: {
          Authorization: `Bearer ${userPageToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 10000,
      }
    );

    return postResponse.data;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Error posting image: ${
        error.response ? error.response.data : error.message
      }`
    );
  }
};

/**
 * Method to post multiple images to a LinkedIn page.
 * @param userPageToken - Access token for the user's LinkedIn page.
 * @param pageId - The ID of the LinkedIn page.
 * @param imagePaths - Array of image paths to post.
 * @param comment - Comment to accompany the images.
 * @returns The response data from the LinkedIn API.
 */
exports.multipleImagePostToLinkedinPageFeed = async (
  userPageToken,
  pageId,
  imagePaths,
  comment
) => {
  try {
    const postResponses = [];

    for (const imagePath of imagePaths) {
      const registerUploadResponse = await axios.post(
        `https://api.linkedin.com/rest/images?action=initializeUpload`,
        {
          initializeUploadRequest: {
            owner: `urn:li:organization:${pageId}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${userPageToken}`,
            "Content-Type": "application/json",
            "Linkedin-Version": "202405",
            "X-Restli-Protocol-Version": "2.0.0",
          },
          timeout: 10000,
        }
      );

      const uploadUrl = registerUploadResponse.data.value.uploadUrl;
      const asset = registerUploadResponse.data.value.image;
      const imageData = await downloadImage(imagePath);

      const form = new FormData();
      form.append("file", imageData, "image.jpg");

      await axios.post(uploadUrl, form, {
        headers: {
          ...form.getHeaders(),
          "Linkedin-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 30000,
      });

      postResponses.push({ id: asset });
    }

    const createPostResponse = await axios.post(
      "https://api.linkedin.com/rest/posts",
      {
        author: `urn:li:organization:${pageId}`,
        commentary: comment,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          multiImage: {
            images: postResponses,
          },
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      },
      {
        headers: {
          Authorization: `Bearer ${userPageToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 30000,
      }
    );

    return createPostResponse.data;
  } catch (error) {
    console.error(error);
    throw new Error(
      `Error posting multiple images: ${
        error.response ? error.response.data : error.message
      }`
    );
  }
};

/**
 * Finalize the video upload.
 * @param {string} videoUrn - The unique video URN.
 * @param {string} uploadToken - Identifier for the upload session.
 * @param {string[]} uploadedPartIds - IDs for each uploaded video part.
 * @returns {Promise<AxiosResponse<any>>} - The response from the finalization step.
 */
const finalizeUpload = async (
  userPageToken,
  videoUrn,
  uploadToken,
  uploadedPartIds
) => {
  const finalizeUploadRequest = {
    video: videoUrn,
    uploadToken,
    uploadedPartIds,
  };

  return axios.post(
    "https://api.linkedin.com/rest/videos?action=finalizeUpload",
    { finalizeUploadRequest },
    {
      headers: {
        Authorization: `Bearer ${userPageToken}`,
        "Content-Type": "application/json",
        "Linkedin-Version": "202405",
        "X-Restli-Protocol-Version": "2.0.0",
      },
      timeout: 30000,
    }
  );
};

/**
 * Upload the video parts.
 * @param {Buffer} videoBuffer - Buffer containing the video data.
 * @param {any[]} uploadInstructions - Array of upload instructions.
 * @returns {Promise<string[]>} - Array of ETags representing the uploaded parts.
 */
const uploadVideoParts = async (videoBuffer, uploadInstructions) => {
  const uploadedPartIds = [];

  for (const instruction of uploadInstructions) {
    const { uploadUrl, firstByte, lastByte } = instruction;
    const partSize = lastByte - firstByte + 1;
    const videoPart = videoBuffer.slice(firstByte, lastByte + 1);

    const uploadResponse = await axios.put(uploadUrl, videoPart, {
      headers: { "Content-Type": "application/octet-stream" },
      maxContentLength: partSize,
    });

    uploadedPartIds.push(uploadResponse.headers.etag);
  }

  return uploadedPartIds;
};

/**
 * Method to post a video to a LinkedIn page.
 * @param userPageToken - Access token for the user's LinkedIn page.
 * @param pageId - The ID of the LinkedIn page.
 * @param videoBuffer - Buffer containing the video data.
 * @param comment - Comment for the video.
 * @returns The response data from the LinkedIn API.
 */
exports.videoPostToLinkedinPageFeed = async (
  userPageToken,
  pageId,
  videoBuffer,
  comment
) => {
  try {
    const registerUploadResponse = await axios.post(
      `https://api.linkedin.com/rest/videos?action=initializeUpload`,
      {
        initializeUploadRequest: {
          owner: `urn:li:organization:${pageId}`,
          fileSizeBytes: videoBuffer.length,
          uploadCaptions: false,
          uploadThumbnail: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${userPageToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 10000,
      }
    );

    const { video, uploadInstructions, uploadToken } =
      registerUploadResponse.data.value;

    // Upload the video parts
    const uploadedPartIds = await uploadVideoParts(
      videoBuffer,
      uploadInstructions
    );

    // Finalize the upload
    await finalizeUpload(userPageToken, video, uploadToken, uploadedPartIds);

    // Post the video to the page
    const postResponse = await axios.post(
      "https://api.linkedin.com/rest/posts",
      {
        author: `urn:li:organization:${pageId}`,
        commentary: comment,
        visibility: "PUBLIC",
        distribution: {
          feedDistribution: "MAIN_FEED",
          targetEntities: [],
          thirdPartyDistributionChannels: [],
        },
        content: {
          media: {
            id: video
          },
        },
        lifecycleState: "PUBLISHED",
        isReshareDisabledByAuthor: false,
      },
      {
        headers: {
          Authorization: `Bearer ${userPageToken}`,
          "Content-Type": "application/json",
          "Linkedin-Version": "202405",
          "X-Restli-Protocol-Version": "2.0.0",
        },
        timeout: 10000,
      }
    );

    return postResponse.data;
  } catch (error) {
    console.log(error);
    throw new Error(
      `Error posting video: ${
        error.response ? error.response.data : error.message
      }`
    );
  }
};
