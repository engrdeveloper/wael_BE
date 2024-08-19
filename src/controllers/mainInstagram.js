const {
  postImageToInstagramAccount,
  postCarouselToInstagramAccount,
  postVideoToInstagramAccount,
} = require("../services/instagramService");
const { getOnePage } = require('../services/pages');
const {
  updatePostToDb,
  savePostToDb,
  updatePostStatus
} = require('../services/facebookService');
const moment = require('moment/moment');
const { delKey, setKeyWithExpiry } = require('../utils/redis');

/**
 * Handles the request to post an image to an Instagram account.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postImageToInstagram = async (req, res) => {
  try {

    // Extract the required parameters from the request body
    // accessToken: The access token for the user's Instagram account.
    // imageUrl: The URL of the image to be posted.
    // igUserId: The ID of the Instagram user.
    // caption: The optional caption for the image (default: "").

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
      postType
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!imageUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById


    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'instagram',
        pageId,
        text: caption,
        type: 'post',
        isApproved: isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: scheduleDate,
        postType
      })

      if (shouldSchedule && scheduleTimeSecs && !draft && update.dataValues.isApproved) {

        await delKey(`instaTextWithImage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`instaTextWithImage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }

    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'instagram',
        pageId,
        text: caption,
        type: 'post',
        isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: scheduleDate,
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`instaTextWithImage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {
        // Post the single image to the Insta page's feed

        return postImageToInstagramAccount({
          igUserId: pageId,
          accessToken: pageToken,
          imageUrl,
          caption,
        }).then(async resp => {

          const status = await updatePostStatus(postId, 'sent')

          return res.status(200).json({ success: true, data: { resp } });

        }).catch(async err => {
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({ success: false, error: { message: err.message } });
        })

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
 * Handles the request to post a carousel of images to an Instagram account.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postCarouselToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    // accessToken: The access token for the user's Instagram account.
    // igUserId: The ID of the Instagram user.
    // imageUrls: An array of URLs of the images to be posted.
    // caption: The optional caption for the carousel (default: "").
    let {
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
      postType
    } = req.body;


    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !imageUrls || imageUrls.length === 0) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    // If the number of images is greater than 10, return an error response
    if (imageUrls.length > 10) {
      return res.status(400).json({ error: "Maximum 10 images allowed" });
    }

    // Post the carousel of images to the Instagram account

    const images = imageUrls.map(url => {

      if (url.includes('.mp4')) {
        return { type: 'video', imageUrl: url }

      }
      return { type: 'image', imageUrl: url }
    })

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'instagram',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        imageUrls: JSON.stringify(imageUrls),
        postedDate: scheduleDate,
        postType
      })

      if (shouldSchedule && scheduleTimeSecs && !draft && update.dataValues.isApproved) {

        await delKey(`instaTextWithMultipleImage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`instaTextWithMultipleImage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }
    else {
      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'instagram',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        imageUrls: JSON.stringify(imageUrls),
        postedDate: scheduleDate,
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`instaTextWithMultipleImage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {

        return postCarouselToInstagramAccount({
          igUserId: pageId,
          accessToken: pageToken,
          mediaItems: images,
          caption: postText,
        }).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          return res.status(200).json({ success: true, data: { resp } });

        }).catch(async err => {
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({ success: false, error: { message: err.message } });

        });

      }
    }
    // Return the response data from the Instagram API
    res.status(200).json({ success: true });
  }
  catch (error) {
    // If an error occurs, return a server error response
    console.error("Error posting carousel to Instagram:", error);
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a video to an Instagram account.
 *
 * https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/#reels-specs
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postVideoToInstagram = async (req, res) => {
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
      postType
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!videoUrl || !pageId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }


    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'instagram',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: scheduleDate,
        postType
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`instaVideoFBPage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`instaVideoFBPage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }
    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'instagram',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: scheduleDate,
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`instaVideoFBPage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {

        // Post the video to the Facebook page's feed
        return postVideoToInstagramAccount({
          media_type: "REELS",
          igUserId: pageId,
          accessToken: pageToken,
          videoUrl,
          caption: postText,
        }).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          return res.status(200).json({ success: true, data: { resp } });
        }).catch(async err => {
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({ success: false, error: { message: err.message } });
        })

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
 * Handles the request to post an image to Instagram's stories.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postStoryImageToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    // accessToken: The access token for the user's Instagram account.
    // imageUrl: The URL of the image to be posted.
    // pageId: The ID of the Instagram user.

    const {
      pageId,
      imageUrl,
      draft,
      status,
      shouldSchedule,
      scheduleTimeSecs,
      scheduleDate,
      postId: editId,
      isApproved,
      postType
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!imageUrl || !pageId) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'instagram',
        pageId,
        type: 'story',
        isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: scheduleDate,
        postType
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`instaStoryImageToPage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`instaStoryImageToPage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }

    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'instagram',
        pageId,
        type: 'story',
        isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: scheduleDate,
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && isApproved && !draft) {
        await setKeyWithExpiry(`instaStoryImageToPage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {
        // Post the story image to the Facebook page's feed
        // The Facebook API expects the image to be uploaded first,
        // and then we can use the image ID to post the image to the page's feed.
        return postImageToInstagramAccount({
          igUserId: pageId,
          accessToken: pageToken,
          imageUrl,
          mediaTypeStory: true,
        }).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          return res.status(200).json({ success: true, data: { resp } });
        }).catch(async err => {
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({ success: false, error: { message: err.message } });

        })

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
 * Handles the request to post a video to Instagram's stories.
 *
 * https://developers.facebook.com/docs/instagram-platform/instagram-graph-api/reference/ig-user/media/#story-video-specifications
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Returns the response data from the Instagram API.
 */
exports.postStoryVideoToInstagram = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const {
      pageId,
      videoUrl,
      draft,
      status,
      shouldSchedule,
      scheduleTimeSecs,
      scheduleDate,
      postId: editId,
      isApproved,
      postType
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !videoUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }


    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'instagram',
        pageId,
        type: 'post',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: scheduleDate,
        postType
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`instaStoryVideoToPage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`instaStoryVideoToPage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }
    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'instagram',
        pageId,
        type: 'post',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: scheduleDate,
        createdBy: req?.user?.userId,
        createdByEmail: req?.user?.email,
        postType
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`instaStoryVideoToPage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {

        // Post the video to the Facebook page's feed
        return postVideoToInstagramAccount({
          media_type: "STORIES",
          igUserId: pageId,
          accessToken: pageToken,
          videoUrl,
        }).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          return res.status(200).json({ success: true, data: { resp } });
        }).catch(async err => {
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({ success: false, error: { message: err.message } });
        })

      }
    }

    res.status(200).json({ success: true });

  }
  catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};
