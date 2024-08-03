const {
  postTextToPageFeed,
  singleImagePostToLinkedinPageFeed,
  multipleImagePostToLinkedinPageFeed,
  videoPostToLinkedinPageFeed,
} = require("../services/linkedinService");
const axios = require("axios");
const { getOnePage } = require('../services/pages');
const {
  updatePostToDb,
  savePostToDb,
  updatePostStatus
} = require('../services/facebookService');
const moment = require('moment/moment');
const { delKey, setKeyWithExpiry } = require('../utils/redis');

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
    const {
      pageId,
      postText,
      draft,
      shouldSchedule,
      scheduleDate,
      scheduleTimeSecs,
      postId: editId,
      isApproved,
      status,
      postType,
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !postText) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId);

    const { pageToken } = getPageById;

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {
      const update = await updatePostToDb(editId, {
        channel: "linkedin",
        pageId,
        text: postText,
        type: "post",
        isApproved,
        status: status,
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        postType,
      });

      if (
        shouldSchedule &&
        scheduleTimeSecs &&
        update.dataValues.isApproved &&
        !draft
      ) {
        await delKey(`linkedinText:${ pageId }:${ editId }:${ pageToken }`);

        await setKeyWithExpiry(
          `linkedinText:${ pageId }:${ editId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }
    }
    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: "linkedin",
        pageId,
        text: postText,
        type: "post",
        isApproved,
        status: status,
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType,
      });

      const postId = addPostToDB?.dataValues.id;

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(
          `linkedinText:${ pageId }:${ postId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }

      // Post the text to the linkedin page's feed
      if (!draft && !shouldSchedule && isApproved) {
        return postTextToPageFeed(pageToken, pageId, postText)
          .then(async (resp) => {
            const status = await updatePostStatus(postId, "sent");
            return res.status(200).json({ success: true, data: { resp } });
          })
          .catch(async (err) => {
            console.log(err.message);
            const status = await updatePostStatus(
              postId,
              "not sent",
              err.message
            );
            return res
              .status(500)
              .json({ success: false, error: { message: err.message } });
          });
      }
    }

    return res.status(200).json({ success: true });

  }
  catch (error) {
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
    const {
      pageId,
      imageUrl,
      caption,
      draft,
      status,
      shouldSchedule,
      scheduleTimeSecs,
      scheduleDate,
      postId: editId,
      isApproved,
      postType,
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !imageUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId);

    const { pageToken } = getPageById;

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {
      const update = await updatePostToDb(editId, {
        channel: "linkedin",
        pageId,
        text: caption,
        type: "post",
        isApproved: isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        postType,
      });

      if (
        shouldSchedule &&
        scheduleTimeSecs &&
        !draft &&
        update.dataValues.isApproved
      ) {

        await delKey(`linkedinTextWithImage:${ pageId }:${ editId }:${ pageToken }`);

        await setKeyWithExpiry(
          `linkedinTextWithImage:${ pageId }:${ editId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }
    }
    else {
      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: "linkedin",
        pageId,
        text: caption,
        type: "post",
        isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType,
      });

      const postId = addPostToDB?.dataValues.id;

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(
          `linkedinTextWithImage:${ pageId }:${ postId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }

      if (!draft && !shouldSchedule && isApproved) {
        // Post the single image to the linkedin page's feed
        return singleImagePostToLinkedinPageFeed(
          pageToken,
          pageId,
          imageUrl,
          caption
        )
          .then(async (resp) => {
            const status = await updatePostStatus(postId, "sent");

            return res.status(200).json({ success: true, data: { resp } });
          })
          .catch(async (err) => {
            const status = await updatePostStatus(
              postId,
              "not sent",
              err.message
            );
            return res
              .status(500)
              .json({ success: false, error: { message: err.message } });
          });
      }
    }

    return res.status(200).json({ success: true });

  }
  catch (error) {
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
      pageId,
      imageUrls,
      status,
      draft,
      postText,
      shouldSchedule,
      scheduleTimeSecs,
      scheduleDate,
      postId: editId,
      isApproved,
      postType,
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !imageUrls) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId);

    const { pageToken } = getPageById;

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {
      const update = await updatePostToDb(editId, {
        channel: "linkedin",
        pageId,
        text: postText,
        type: "post",
        isApproved,
        status: status,
        imageUrls: JSON.stringify(imageUrls),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        postType,
      });

      if (
        shouldSchedule &&
        scheduleTimeSecs &&
        !draft &&
        update.dataValues.isApproved
      ) {
        await delKey(`linkedinTextWithMultipleImage:${ pageId }:${ editId }:${ pageToken }`);

        await setKeyWithExpiry(
          `linkedinTextWithMultipleImage:${ pageId }:${ editId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }
    }
    else {

      // save post to DB
      const addPostToDB = await savePostToDb({
        channel: "linkedin",
        pageId,
        text: postText,
        type: "post",
        isApproved,
        status: status,
        imageUrls: JSON.stringify(imageUrls),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType,
      });

      const postId = addPostToDB?.dataValues.id;

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(
          `linkedinTextWithMultipleImage:${ pageId }:${ postId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }

      if (!draft && !shouldSchedule && isApproved) {
        return multipleImagePostToLinkedinPageFeed(
          pageToken,
          pageId,
          imageUrls,
          postText
        )
          .then(async (resp) => {
            const status = await updatePostStatus(postId, "sent");
            return res.status(200).json({ success: true, data: { resp } });
          })
          .catch(async (err) => {
            const status = await updatePostStatus(
              postId,
              "not sent",
              err.message
            );
            return res
              .status(500)
              .json({ success: false, error: { message: err.message } });
          });
      }
    }

    res.status(200).json({ success: true });


  }
  catch (error) {
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
      pageId,
      videoUrl,
      postText,
      draft,
      status,
      shouldSchedule,
      scheduleTimeSecs,
      scheduleDate,
      postId: editId,
      isApproved,
      postType,
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !videoUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId);

    const { pageToken } = getPageById;

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {
      const update = await updatePostToDb(editId, {
        channel: "linkedin",
        pageId,
        text: postText,
        type: "post",
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        postType,
      });

      if (
        shouldSchedule &&
        scheduleTimeSecs &&
        update.dataValues.isApproved &&
        !draft
      ) {
        await delKey(`linkedinVideoPage:${ pageId }:${ editId }:${ pageToken }`);

        await setKeyWithExpiry(
          `linkedinVideoPage:${ pageId }:${ editId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }
    }
    else {
      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: "linkedin",
        pageId,
        text: postText,
        type: "post",
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format("YYYY-MM-DD HH:mm:ss"),
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType,
      });

      const postId = addPostToDB?.dataValues.id;

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(
          `linkedinVideoPage:${ pageId }:${ postId }:${ pageToken }`,
          "some value",
          scheduleTimeSecs
        );
      }

      if (!draft && !shouldSchedule && isApproved) {

        // Download the video
        const videoBuffer = await downloadVideo(videoUrl);

        // If the video download fails, return a bad request response
        if (!videoBuffer) {
          return res.status(400).json({ error: "Failed to download video" });
        }

        // Post the postText to the page's feed
        return videoPostToLinkedinPageFeed(
          pageToken,
          pageId,
          videoBuffer,
          postText
        )
          .then(async (res) => {
            const status = await updatePostStatus(postId, "sent");
            return res.status(200).json({ success: true, data: { res } });
          })
          .catch(async (err) => {
            const status = await updatePostStatus(postId, "not sent", err.message);
            return res
              .status(500)
              .json({ success: false, error: { message: err.message } });
          });
      }
    }

    res.status(200).json({ success: true });

  }
  catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};
