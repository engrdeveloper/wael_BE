/**
 * Defines the Posts model.
 * @param {Object} sequelize - The Sequelize instance.
 * @param {Object} DataTypes - The DataTypes object from Sequelize.
 * @returns {Object} - The Post model.
 */
module.exports = (sequelize, DataTypes) => {
  const Posts = sequelize.define("Posts", {
    /**
     * The ID of the page from Social Channel.
     * @type {string}
     */
    pageId: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
    },
    /**
     * The text of the post.
     * @type {Text}
     */
    text: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      required: false,
    },
    /**
     * The imageUls of the post.
     * @type {string}
     */
    imageUrls: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      required: false,
    },

    /**
     * The type of the user to access post.
     * @type {Enum}
     */
    type: {
      type: DataTypes.ENUM,
      values: ["story", "reel", "post"],
      required: true,
    },

    /**
     * The urls of the posts.
     * @type {text}
     */
    videoUrls: {
      type: DataTypes.TEXT('long'),
      allowNull: true,
      required: false,
      primaryKey: false
    },
    /**
     * The channel of the posts.
     * @type {text}
     */
    channel: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
    },
    /**
     * The urls of the posts.
     * @type {boolean}
     */
    isApproved: {
      type: DataTypes.BOOLEAN,
      defaultValue: false
    },
    /**
     * The status of the posts.
     * @type {status}
     */
    status: {
      type: DataTypes.ENUM,
      values: ["queue", "sent", "draft"],
      required: true,
    },
    postedDate: {
      type: DataTypes.STRING,
      required: true,
    },
  });

  return Posts;
};
