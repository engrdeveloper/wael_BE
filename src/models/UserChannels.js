module.exports = (sequelize, DataTypes) => {

    const UserChannels = sequelize.define("UserChannels", {
        userId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            required: true
        },
        role: {
            type: DataTypes.ENUM,
            values: ['maintainer', 'editor'],
            required: true
        },
        mainUserId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            required: true
        },
        channelId: {
            type: DataTypes.INTEGER,
            allowNull: false,
            required: true
        }

    });

    return UserChannels;
};
