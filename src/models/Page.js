/**
 * Defines the Page model.
 * @param {Object} sequelize - The Sequelize instance.
 * @param {Object} DataTypes - The DataTypes object from Sequelize.
 * @returns {Object} - The Page model.
 */
module.exports = (sequelize, DataTypes) => {
  // Define the Page model with the userId, role, mainUserId, and page properties.
  const Page = sequelize.define("Page", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    /**
     * The ID of the page from Social Channel.
     * will be used as insta ID as well
     * @type {string}
     */
    pageId: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
    },
    /**
     * The name of the page.
     * @type {number}
     */
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
    },
    /**
     * The token of the page.
     * @type {string}
     */
    pageToken: {
      type: DataTypes.TEXT('long'),
      allowNull: false,
      required: true,
    },
    /**
     * The token of the user to access pages.
     * @type {string}
     */
    userToken: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
    },
    /**
     * The ID of the main user.
     * @type {number}
     */
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      required: true,
      primaryKey: false
    },
    channel: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
    }
  });

  return Page;
};
