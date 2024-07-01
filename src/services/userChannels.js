const db = require("../models");

/**
 * Adds a channel to the UserChannels table.
 * @param {Object} channelData - The data for the channel.
 * @param {string} channelData.userId - The ID of the user.
 * @param {string} channelData.role - The role of the user in the channel.
 * @param {string} channelData.mainUserId - The ID of the main user.
 * @param {string} channelData.channelId - The ID of the channel.
 * @returns {Promise<Object>} - A promise that resolves to the created channel object.
 */
exports.addChannel = async ({ userId, role, mainUserId, channelId }) => {
  return db.UserChannels.create({ userId, role, mainUserId, channelId });
};

/**
 * Retrieves a channel from the UserChannels table by its ID.
 * @param {string} channelId - The ID of the channel.
 * @returns {Promise<Object|null>} - A promise that resolves to the channel object or null if not found.
 */
exports.getOneChannel = async (channelId) => {
  return db.UserChannels.findByPk(channelId);
};

/**
 * Updates a channel in the UserChannels table.
 * @param {string} channelId - The ID of the channel.
 * @param {Object} updateData - The data to update the channel with.
 * @param {string} updateData.userId - The ID of the user.
 * @param {string} updateData.role - The role of the user in the channel.
 * @param {string} updateData.mainUserId - The ID of the main user.
 * @returns {Promise<Object|null>} - A promise that resolves to the updated channel object or null if not found.
 */
exports.updateChannel = async (channelId, { userId, role, mainUserId }) => {
  const channel = await db.UserChannels.findByPk(channelId);
  if (!channel) {
    return null;
  }
  await channel.update({ userId, role, mainUserId });
  return channel;
};

/**
 * Deletes a channel from the UserChannels table by its ID.
 * @param {string} channelId - The ID of the channel.
 * @returns {Promise<Object|null>} - A promise that resolves to the deleted channel object or null if not found.
 */
exports.deleteChannelById = async (channelId) => {
  const channel = await db.UserChannels.findByPk(channelId);
  if (!channel) {
    return null;
  }
  return channel.destroy();
};
