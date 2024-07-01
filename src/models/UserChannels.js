/**
 * Defines the UserChannels model.
 * @param {Object} sequelize - The Sequelize instance.
 * @param {Object} DataTypes - The DataTypes object from Sequelize.
 * @returns {Object} - The UserChannels model.
 */
module.exports = (sequelize, DataTypes) => {
  // Define the UserChannels model with the userId, role, mainUserId, and channelId properties.
  const UserChannels = sequelize.define("UserChannels", {
    /**
     * The ID of the user.
     * @type {number}
     */
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      required: true,
    },
    /**
     * The role of the user in the channel.
     * @type {string}
     */
    role: {
      type: DataTypes.ENUM,
      values: ["maintainer", "editor"],
      required: true,
    },
    /**
     * The ID of the main user.
     * @type {number}
     */
    mainUserId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      required: true,
    },
    /**
     * The ID of the channel.
     * @type {number}
     */
    channelId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      required: true,
    },
  });

  return UserChannels;
};
