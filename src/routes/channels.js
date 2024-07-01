// This module exports a function that creates a Channel model.
// The Channel model represents a single channel in the database.
// It has a single property called 'name', which is a non-null string.

module.exports = (sequelize, DataTypes) => {
  // Define the Channel model using Sequelize's define method.
  // The first argument is the model name (Channel), and the second argument is an object that defines the model's properties.
  // The name property is defined as a non-null string.
  const Channel = sequelize.define("Channel", {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  });

  // Return the defined Channel model.
  return Channel;
};
