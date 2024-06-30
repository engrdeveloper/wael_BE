const db = require('../models');

exports.addChannel = async ({userId, role, mainUserId, channelId}) => {
    return db.UserChannels.create({userId, role, mainUserId, channelId});
};

exports.getOneChannel = async (channelId) => {
    return db.UserChannels.findByPk(channelId);
};

exports.updateChannel = async (channelId, {userId, role, mainUserId}) => {
    const channel = await db.UserChannels.findByPk(channelId);
    if (!channel) {
        return null;
    }
    await channel.update({userId, role, mainUserId});
    return channel;
};

exports.deleteChannelById = async (channelId) => {
    const channel = await db.UserChannels.findByPk(channelId);
    if (!channel) {
        return null;
    }
    return channel.destroy();
};


