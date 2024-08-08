/**
 * Defines the User model.
 * @param {Object} sequelize - The Sequelize instance.
 * @param {Object} DataTypes - The DataTypes object from Sequelize.
 * @returns {Object} - The User model.
 */
module.exports = (sequelize, DataTypes) => {
  // Define the User model with the email and password properties.
  const User = sequelize.define("User", {
    // The email property is a non-null string.
    email: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    // The password property is a non-null string.
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    }
  });

  return User;
};
