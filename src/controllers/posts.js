const postService = require("../services/posts");
const { getOnePage } = require('../services/pages');
const { delKey, delKeyWithPattern, setKeyWithExpiry } = require('../utils/redis');
const {
  updatePostStatus,
  textPostToFbPageFeed,
  singleImagePostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
  reelPostToFbPageFeed,
  storyVideoToFbPageFeed,
  storyImageToFbPageFeed, updatePostToDb
} = require('../services/facebookService');
const { getOnePostById } = require('../services/posts');

/**
 * Retrieves a single post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getOnePostById = async (req, res) => {
  try {

    // Get the post ID from the request parameters
    const postId = req.params.id;

    // Check if the post ID is missing
    if (!postId) {
      return res.status(500).json({
        success: false,
        error: { message: "User Post ID is required" },
      });
    }

    // Retrieve the post from the database
    const post = await postService.getOnePostById(pageId);

    // Check if the post is not found
    if (!post) {
      return res
        .status(200)
        .json({ success: false, message: "User Post Not Found" });
    }

    // Return the post as a success response
    res.status(200).json({ success: true, data: { post } });

  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves a single post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getPostsByPageId = async (req, res) => {

  try {

    // Get the post ID from the request parameters
    const pageId = req.params.pageId;

    const status = req.params.status

    const filters = req?.query?.filters ? JSON.parse(req.query.filters) : {}

    // Check if the post ID is missing
    if (!pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "Page ID is required" },
      });
    }

    // Retrieve the post from the database
    const post = await postService.getPostsByPageId(pageId, status, filters?.page);

    // Check if the post is not found
    if (!post) {
      return res
        .status(200)
        .json({ success: false, message: "User Post Not Found" });
    }

    // Return the post as a success response
    res.status(200).json({ success: true, data: { ...post } });

  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves a single post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getPostsByPageIdIntervals = async (req, res) => {

  try {

    // Get the post ID from the request parameters
    const pageId = req.params.pageId;
    const view = req.params.view;

    // Check if the post ID is missing
    if (!pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "Page ID is required" },
      });
    }

    // Retrieve the post from the database
    const post = await postService.getPostsByPageIdIntervals(pageId, view);

    // Check if the post is not found
    if (!post) {
      return res
        .status(200)
        .json({ success: false, message: "User Post Not Found" });
    }

    // Return the post as a success response
    res.status(200).json({ success: true, data: { post } });

  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Deletes a post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.deletePostById = async (req, res) => {
  try {
    // Get the post ID from the request parameters
    const postId = req.params.id;

    const pageId = req.params.pageId

    // Check if the post ID is missing
    if (!postId || !pageId) {
      return res.status(500).json({ error: "Missing required parameters" });
    }

    await delKeyWithPattern(`${ pageId }:${ postId }`)

    // Delete the post from the database
    const deletedPost = await postService.deletePostById(postId);

    // Check if the post is not found
    if (!deletedPost) {
      return res
        .status(200)
        .json({ success: false, message: "Post Not Found" });
    }

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Post Deleted Successfully" });
  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

exports.approvePost = async (req, res) => {

  try {
    // Get the post ID from the request body

    const { postId, pageId, postType, shouldSchedule, scheduledSeconds } = req.body

    // Check if the post ID is missing
    if (!postId || !pageId) {
      return res.status(500).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    if (shouldSchedule && scheduledSeconds) {
      await setKeyWithExpiry(`${ postType }:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduledSeconds)
    }
    else {

      const status = await updatePostToDb(postId, { isApproved: true })

      await setKeyWithExpiry(`${ postType }:${ pageId }:${ postId }:${ pageToken }`, 'some value', 5)
    }


    // Return a success response
    return res
      .status(200)
      .json({ success: true, message: "Post Approved Successfully" });
  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

exports.rejectPost = async (req, res) => {
  try {
    // Get the post ID from the request parameters
    const postId = req.params.id;

    // Check if the post ID is missing
    if (!postId) {
      return res.status(500).json({ error: "Missing required parameters" });
    }
    const rejectedPost = await updatePostStatus(postId, 'rejected');

    // Check if the post is not found
    if (!rejectedPost) {
      return res
        .status(200)
        .json({ success: false, message: "Post Not Found" });
    }

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Post Rejected Successfully" });
  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};