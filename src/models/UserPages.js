/**
 * Defines the UserPages model.
 * @param {Object} sequelize - The Sequelize instance.
 * @param {Object} DataTypes - The DataTypes object from Sequelize.
 * @returns {Object} - The UserPages model.
 */
module.exports = (sequelize, DataTypes) => {
  // Define the UserPages model with the userId, role, mainUserId, and pageId properties.
  const UserPages = sequelize.define("UserPages", {

    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      field: 'id' // or the actual column name in the database
    },
    /**
     * The ID of the user.
     * @type {number}
     */
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      required: true,
      primaryKey: false
    },
    userEmail: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
      primaryKey: false
    },
    /**
     * The role of the user in the page.
     * @type {string}
     */
    role: {
      type: DataTypes.ENUM,
      values: ["maintainer", "editor", "owner"],
      required: true,
    },
    /**
     * The ID of the page.
     * @type {number}
     */
    pageId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      required: true,
      primaryKey: false
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      required: true,
      primaryKey: false
    },
    createdAt: {
      type: 'TIMESTAMP',
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    },
    updatedAt: {
      type: 'TIMESTAMP',
      defaultValue: sequelize.literal('CURRENT_TIMESTAMP'),
      allowNull: false
    }
  });

  return UserPages;
};
