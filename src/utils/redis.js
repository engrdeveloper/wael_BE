const { redisConfig } = require('../config');
const Redis = require('ioredis');
const {
  textPostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  singleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
  reelPostToFbPageFeed,
  storyVideoToFbPageFeed,
  storyImageToFbPageFeed
} = require('../services/facebookService');
const { getOnePostById } = require('../services/posts')

const redisJSON = new Redis(redisConfig);
const redisEvents = new Redis(redisConfig);

exports.setKeyWithExpiry = async (key, value, expirySeconds = 10) => {
  try {
    await redisJSON.set(key, value, 'EX', expirySeconds);
    console.log(`Key set: ${ key } with expiry: ${ expirySeconds } seconds`);
  }
  catch (err) {
    console.error('Error setting key with expiry:', err);
  }
};

exports.delKey = async (key) => {
  try {
    await redisJSON.del(key);
    console.log(`Key del: ${ key }`);
  }
  catch (err) {
    console.error('Error setting key with expiry:', err);
  }
};

exports.delKeyWithPattern = async (key) => {
  try {
    console.log(`${ key }*`)
    const keys = await redisJSON.keys(`*${ key }*`);

    const promises = keys.map(k => exports.delKey(k))

    Promise.all(promises).then((values) => {
      console.log(`Key deleted count: ${ keys.length }`);
    }).catch(err => {
      console.log(err.message)
    });

  }
  catch (err) {
    console.error('Error setting key with expiry:', err);
  }
};


// Enable key event notifications
redisEvents.config('SET', 'notify-keyspace-events', 'Ex')
  .then(() => {
    console.log('Keyspace notifications enabled');
  })
  .catch((err) => {
    console.error('Failed to configure keyspace notifications:', err);
  });

// Subscribe to key expiration events
redisEvents.psubscribe('__keyevent@0__:expired', (err, count) => {
  if (err) {
    console.error('Failed to subscribe:', err);
  }
  else {
    console.log(`Subscribed successfully! This client is currently subscribed to ${ count } channels.`);
  }
});

redisEvents.on('pmessage', async (pattern, channel, message) => {

  try {
    const messageContent = message.split(':')
    const type = messageContent[0]
    const pageId = messageContent[1]
    const postId = messageContent[2]
    const pageToken = messageContent[3]

    const post = await getOnePostById(postId)

    const { text, imageUrls, videoUrls } = post

    if (type === 'text') {
      const facebookResponse = await textPostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        message: text,
      });

      console.log(facebookResponse, 'response from fb')

    }

    if (type === 'textWithImage') {

      const imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

      const facebookResponse = await singleImagePostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        imageUrl,
        caption: text,
      });

      console.log(facebookResponse, 'response from fb')
    }


    if (type === 'textWithMultipleImage') {

      const imageUrl = !!imageUrls ? JSON.parse(imageUrls) : ''

      const facebookResponse = await multipleImagePostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        imageUrl,
        caption: text
      });

      console.log(facebookResponse, 'response from fb')
    }

    if (type === 'videoFBPage') {

      const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      const facebookResponse = await videoPostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        videoUrl,
        description: text, // The optional description for the video.
      });

      console.log(facebookResponse, 'response from fb')
    }


    if (type === 'reelToPage') {

      const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      const facebookResponse = await reelPostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        videoUrl,
        description: text,
      });

      console.log(facebookResponse, 'response from fb')
    }

    if (type === 'storyVideoToPage') {

      const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      const facebookResponse = await storyVideoToFbPageFeed({
        accessToken: pageToken,
        pageId,
        videoUrl,
      });
      console.log(facebookResponse, 'response from fb')
    }

    if (type === 'storyImageToPage') {

      const imageUrl = !!videoUrls ? JSON.parse(imageUrl)[0] : ''

      const facebookResponse = await storyImageToFbPageFeed({
        accessToken: pageToken,
        pageId,
        imageUrl,
        caption: text,
      });

      console.log(facebookResponse, 'response from fb')
    }

  }
  catch (e) {
    console.log('error while posting to the page', e.message)
  }


});
