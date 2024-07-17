const postService = require("../services/posts");
const { getOnePage } = require('../services/pages');
const { delKey, delKeyWithPattern } = require('../utils/redis');

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

    // Check if the post ID is missing
    if (!pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "Page ID is required" },
      });
    }

    console.log(pageId, '...')
    // Retrieve the post from the database
    const post = await postService.getPostsByPageId(pageId, status);

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
