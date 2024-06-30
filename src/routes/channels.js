module.exports = (sequelize, DataTypes) => {

    const Channel = sequelize.define("Channel", {
        name: {
            type: DataTypes.STRING,
            allowNull: false
        }
    });

    return Channel;
};
