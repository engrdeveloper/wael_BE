const userChannelService = require('../services/userChannels');

exports.addChannel = async (req, res) => {

    try {

        const {userId, role, mainUserId, channelId} = req.body;

        if (!userId || !role || !mainUserId || !channelId) {
            return res.status(500).json({success: false, error: {message: 'All fields are required'}});
        }

        const channel = await userChannelService.addChannel({userId, role, mainUserId, channelId});

        res.status(200).json({success: true, message: 'Channel Created Successfully'});

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};

exports.getOneChannel = async (req, res) => {

    try {
        const channelId = req.params.id;

        if (!channelId) {
            return res.status(500).json({success: false, error: {message: 'User Channel ID is required'}});
        }

        const channel = await userChannelService.getOneChannel(channelId);

        if (!channel) {
            return res.status(200).json({success: false, message: 'User Channel Not Found'});
        }

        res.status(200).json({success: true, data: {channel}});

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};

exports.updateChannel = async (req, res) => {

    try {

        const channelId = req.params.id;

        const {userId, role, mainUserId} = req.body;

        if (!userId || !role || !mainUserId || !channelId) {
            return res.status(500).json({success: false, error: {message: 'All fields are required'}});
        }

        const updatedChannel = await userChannelService.updateChannel(channelId, {userId, role, mainUserId});

        if (!updatedChannel) {
            return res.status(200).json({success: false, message: 'User Channel Not Found'});
        }

        res.status(200).json({success: true, data: {updatedChannel}});

    } catch (error) {
        res.status(500).json({success: false, error: {message: 'Something went wrong', reason: error.message}})
    }
};

exports.deleteChannel = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(500).json({success: false, error: {message: 'Channel ID is required'}});
        }

        const deletedChannel = await userChannelService.deleteChannelById(userId);

        if (!deletedChannel) {
            return res.status(200).json({success: false, message: 'Channel Not Found'});
        }

        res.status(200).json({success: true, message: 'Channel Deleted Successfully'});

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};
