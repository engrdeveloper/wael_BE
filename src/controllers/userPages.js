// Import the userPageService module
const userPageService = require("../services/userPages");
const { getOneUser } = require('../services/users')

/**
 * Adds a new page to the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.addPage = async (req, res) => {
  try {
    // Get the page data from the request body
    const { userId, role, pageId } = req.body;

    // Check if any of the required fields are missing
    if (!userId || !role || !pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "All fields are required" },
      });
    }

    // Add the page to the database
    const response = await userPageService.addUserPage(
      userId,
      role,
      pageId
    );

    if (!response) {
      return res.status(500).json({
        success: false,
        error: { message: "User Not Found" },
      });
    }

    // Return a success response
    res.status(200)
      .json({ success: true, message: "Page Created Successfully" });

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
 * Retrieves a single page from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getOnePage = async (req, res) => {
  try {
    // Get the page ID from the request parameters
    const pageId = req.params.id;

    // Check if the page ID is missing
    if (!pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "User Page ID is required" },
      });
    }

    // Retrieve the page from the database
    const page = await userPageService.getOneUserPage(pageId);

    // Check if the page is not found
    if (!page) {
      return res
        .status(200)
        .json({ success: false, message: "User Page Not Found" });
    }

    // Return the page as a success response
    res.status(200).json({ success: true, data: { page } });
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
 * Updates a page in the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.updatePage = async (req, res) => {
  try {
    // Get the page ID from the request parameters
    const pageId = req.params.id;

    // Get the page data from the request body
    const { role } = req.body;

    // Check if any of the required fields are missing
    if ( !role || !pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "All fields are required" },
      });
    }

    // Update the page in the database
    const updatedPage = await userPageService.updateUserChannel(pageId, {
      role
    });

    // Check if the page is not found
    if (!updatedPage) {
      return res
        .status(200)
        .json({ success: false, message: "User Page Not Found" });
    }

    // Return the updated page as a success response
    res.status(200).json({ success: true, data: { updatedPage } });
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
 * Deletes a page from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.deletePage = async (req, res) => {
  try {
    // Get the page ID from the request parameters
    const userId = req.params.id;

    // Check if the page ID is missing
    if (!userId) {
      return res.status(500).json({
        success: false,
        error: { message: "Page ID is required" },
      });
    }

    // Delete the page from the database
    const deletedPage = await userPageService.deleteUserPageById(userId);

    // Check if the page is not found
    if (!deletedPage) {
      return res
        .status(200)
        .json({ success: false, message: "Page Not Found" });
    }

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Page Deleted Successfully" });
  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

exports.invite = async (req, res) => {
  try {
    // Get the email from the request body
    const { email, pageId, mainUserId, role } = req.body;

    // If email is missing, return an error response
    if (!email) {
      return res
        .status(500)
        .json({ success: false, error: { message: "Email are required" } });
    }

    // Send a password reset email to the user with the given email
    const user = await userPageService.invite(email, pageId, mainUserId, role);

    // If user is not found, return an error response
    if (!user) {
      return res
        .status(500)
        .json({ success: false, error: { message: "Invalid Email" } });
    }

    // Return a success response with a message
    res.status(200).json({ success: true, message: "Email sent" });
  }
  catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};
