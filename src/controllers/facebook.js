const axios = require("axios");
const {
  textPostToFbPageFeed,
  singleImagePostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
  reelPostToFbPageFeed,
  storyVideoToFbPageFeed,
  storyImageToFbPageFeed,
  savePostToDb,
  updatePostToDb
} = require("../services/facebookService");
const { getOnePage } = require('../services/pages')
const { setKeyWithExpiry, delKey } = require('../utils/redis')
const moment = require('moment');


/**
 * Retrieves a long-lived page access token from Facebook's Graph API.
 *
 * @param {string} longLivedUserToken - The long-lived user access token.
 * @param {string} pageId - The ID of the page.
 * @returns {Promise<string>} - The long-lived page access token.
 */
exports.getLongLivedPageToken = async (longLivedUserToken, pageId) => {
  // Construct the URL for the Graph API request.
  const url = `https://graph.facebook.com/${ pageId }?fields=access_token&access_token=${ longLivedUserToken }`;

  // Send a GET request to the Graph API and retrieve the page access token.
  const response = await axios.get(url);
  return response.data.access_token;
};

/**
 * Handles the success of the user's Facebook login.
 *
 * @param {Object} userData - The user data object containing the access token.
 * @returns {Promise<Array>} - An array of page data objects.
 */
exports.handleUserFacebookLoginSuccess = async (userData) => {
  try {
    // Get the access token from the user data.
    const accessToken = userData.accessToken;

    // Fetch the user's Facebook pages data.
    const response = await axios.get(`https://graph.facebook.com/me/accounts`, {
      params: {
        access_token: accessToken,
        fields:
          "id,name,access_token,category,category_list,tasks,instagram_business_account",
      },
      headers: {
        Accept: "application/json",
      },
    });

    // The response.data contains an array of objects, each representing a page.
    const pagesData = response.data;

    // TODO: Handle saving the user data from here.
    // TODO: Save each page data to the database or any custom logic.

    // Return the array of page data.
    return pagesData.data;
  }
  catch (err) {
    // Log any errors that occur while handling the Facebook login.
    console.log("Error while handling facebook login", err);
  }
};

/**
 * Handles the request to post text to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the facebook API
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
      status
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !postText) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`text:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`text:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }

    else {
      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: req?.user?.userId
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`text:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      // Post the text to the Facebook page's feed
      if (!draft && !shouldSchedule && isApproved) {
        const facebookResponse = await textPostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          message: postText,
        });

      }

    }

    // Return the response data from the Facebook API
    res.status(200).json({ success: true });

  }
  catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a single image to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API.
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
      isApproved
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !imageUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'facebook',
        pageId,
        text: caption,
        type: 'post',
        isApproved: isApproved,
        status: status,
        imageUrl: JSON.stringify([imageUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })

      if (shouldSchedule && scheduleTimeSecs && !draft && update.dataValues.isApproved) {

        await delKey(`textWithImage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`textWithImage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }

    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'facebook',
        pageId,
        text: caption,
        type: 'post',
        isApproved,
        status: status,
        imageUrl: JSON.stringify([imageUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: req?.user?.userId
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`textWithImage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {
        // Post the single image to the Facebook page's feed
        const facebookResponse = await singleImagePostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          imageUrl,
          caption,
        });

        // Return the response data from the Facebook API
        return res.status(200).json(facebookResponse);
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
 * Posts multiple images to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the facebook API.
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
      isApproved
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !imageUrls) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        imageUrls: JSON.stringify(imageUrls),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })

      if (shouldSchedule && scheduleTimeSecs && !draft && update.dataValues.isApproved) {

        await delKey(`textWithMultipleImage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`textWithMultipleImage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }
    else {
      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        imageUrls: JSON.stringify(imageUrls),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: req?.user?.userId
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`textWithMultipleImage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {
        const facebookResponse = await multipleImagePostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          imageUrls,
          caption: postText
        });

        // Return the response data from the Facebook API
        return res.status(200).json(facebookResponse);
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
 * Handles the request to post a video to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the facebook API
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
      isApproved
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
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`videoFBPage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`videoFBPage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }
    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'post',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: req?.user?.userId
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`videoFBPage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {

        // Post the video to the Facebook page's feed
        const facebookResponse = await videoPostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          videoUrl,
          description: postText, // The optional description for the video.
        });

        return res.status(200).json(facebookResponse);

      }
    }

    // Return the response data from the Facebook API

    res.status(200).json({ success: true });
  }
  catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};

/**
 * Handles the request to post a video to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API
 */
exports.reelPostToPageFeed = async (req, res) => {
  try {
    // Extract the required parameters from the request body
    const {
      pageId,
      videoUrl,
      postText,
      status,
      draft,
      shouldSchedule,
      scheduleTimeSecs,
      scheduleDate,
      postId: editId,
      isApproved
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
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'reel',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`reelToPage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`reelToPage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)

      }

    }
    else {
      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'facebook',
        pageId,
        text: postText,
        type: 'reel',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: req?.user?.userId
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && isApproved && !draft) {
        await setKeyWithExpiry(`reelToPage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {

        // Post the reels video to the Facebook page's feed
        // The description is an optional field for the video
        const facebookResponse = await reelPostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          videoUrl,
          description: postText,
        });

        // Return the response data from the Facebook API
        return res.status(200).json(facebookResponse);
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
 * Handles the request to post a story video to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API
 */
exports.storyVideoToPageFeed = async (req, res) => {

  try {
    // Extract the required parameters from the request body
    const {
      pageId,
      videoUrl,
      status,
      draft,
      shouldSchedule,
      scheduleTimeSecs,
      scheduleDate,
      postId: editId,
      isApproved
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
        channel: 'facebook',
        pageId,
        text: null,
        type: 'story',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`storyVideoToPage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`storyVideoToPage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }
    else {
      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'facebook',
        pageId,
        text: null,
        type: 'story',
        isApproved,
        status: status,
        videoUrls: JSON.stringify([videoUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: req?.user?.userId
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && !draft && isApproved) {
        await setKeyWithExpiry(`storyVideoToPage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {
        // Post the stroy video to the Facebook page's feed
        // The Facebook API expects the video to be uploaded first,
        // and then we can use the video ID to post the video to the page's feed.
        const facebookResponse = await storyVideoToFbPageFeed({
          accessToken: pageToken,
          pageId,
          videoUrl,
        });

        // Return the response data from the Facebook API
        return res.status(200).json(facebookResponse);
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
 * Handles the request to post a story image to a Facebook page's feed.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Object} - Return the response from the Facebook API
 */
exports.storyImageToPageFeed = async (req, res) => {

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
      isApproved
    } = req.body;

    // If any of the required parameters are missing, return a bad request response
    if (!pageId || !imageUrl) {
      return res.status(400).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (editId) {

      const update = await updatePostToDb(editId, {
        channel: 'facebook',
        pageId,
        text: caption,
        type: 'story',
        isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss')
      })

      if (shouldSchedule && scheduleTimeSecs && update.dataValues.isApproved && !draft) {

        await delKey(`storyImageToPage:${ pageId }:${ editId }:${ pageToken }`)

        await setKeyWithExpiry(`storyImageToPage:${ pageId }:${ editId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

    }

    else {

      //save post to DB
      const addPostToDB = await savePostToDb({
        channel: 'facebook',
        pageId,
        text: caption,
        type: 'story',
        isApproved,
        status: status,
        imageUrls: JSON.stringify([imageUrl]),
        postedDate: shouldSchedule ? scheduleDate : moment(new Date()).format('YYYY-MM-DD HH:mm:ss'),
        createdBy: req?.user?.userId
      })

      const postId = addPostToDB?.dataValues.id

      if (shouldSchedule && scheduleTimeSecs && isApproved && !draft) {
        await setKeyWithExpiry(`storyImageToPage:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduleTimeSecs)
      }

      if (!draft && !shouldSchedule && isApproved) {
        // Post the story image to the Facebook page's feed
        // The Facebook API expects the image to be uploaded first,
        // and then we can use the image ID to post the image to the page's feed.
        const facebookResponse = await storyImageToFbPageFeed({
          accessToken: pageToken,
          pageId,
          imageUrl,
          caption,
        });

        // Return the response data from the Facebook API
        return res.status(200).json(facebookResponse);
      }
    }

    return res.status(200).json({ success: true });

  }
  catch (error) {
    // If an error occurs, return a server error response
    res.status(500).json({ error: error.message });
  }
};
