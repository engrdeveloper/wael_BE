// Import the userChannelService module
const userChannelService = require("../services/userChannels");

/**
 * Adds a new channel to the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.addChannel = async (req, res) => {
  try {
    // Get the channel data from the request body
    const { userId, role, mainUserId, channelId } = req.body;

    // Check if any of the required fields are missing
    if (!userId || !role || !mainUserId || !channelId) {
      return res.status(500).json({
        success: false,
        error: { message: "All fields are required" },
      });
    }

    // Add the channel to the database
    await userChannelService.addChannel({
      userId,
      role,
      mainUserId,
      channelId,
    });

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Channel Created Successfully" });
  } catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves a single channel from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getOneChannel = async (req, res) => {
  try {
    // Get the channel ID from the request parameters
    const channelId = req.params.id;

    // Check if the channel ID is missing
    if (!channelId) {
      return res.status(500).json({
        success: false,
        error: { message: "User Channel ID is required" },
      });
    }

    // Retrieve the channel from the database
    const channel = await userChannelService.getOneChannel(channelId);

    // Check if the channel is not found
    if (!channel) {
      return res
        .status(200)
        .json({ success: false, message: "User Channel Not Found" });
    }

    // Return the channel as a success response
    res.status(200).json({ success: true, data: { channel } });
  } catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Updates a channel in the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.updateChannel = async (req, res) => {
  try {
    // Get the channel ID from the request parameters
    const channelId = req.params.id;

    // Get the channel data from the request body
    const { userId, role, mainUserId } = req.body;

    // Check if any of the required fields are missing
    if (!userId || !role || !mainUserId || !channelId) {
      return res.status(500).json({
        success: false,
        error: { message: "All fields are required" },
      });
    }

    // Update the channel in the database
    const updatedChannel = await userChannelService.updateChannel(channelId, {
      userId,
      role,
      mainUserId,
    });

    // Check if the channel is not found
    if (!updatedChannel) {
      return res
        .status(200)
        .json({ success: false, message: "User Channel Not Found" });
    }

    // Return the updated channel as a success response
    res.status(200).json({ success: true, data: { updatedChannel } });
  } catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Deletes a channel from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.deleteChannel = async (req, res) => {
  try {
    // Get the channel ID from the request parameters
    const userId = req.params.id;

    // Check if the channel ID is missing
    if (!userId) {
      return res.status(500).json({
        success: false,
        error: { message: "Channel ID is required" },
      });
    }

    // Delete the channel from the database
    const deletedChannel = await userChannelService.deleteChannelById(userId);

    // Check if the channel is not found
    if (!deletedChannel) {
      return res
        .status(200)
        .json({ success: false, message: "Channel Not Found" });
    }

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Channel Deleted Successfully" });
  } catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};
