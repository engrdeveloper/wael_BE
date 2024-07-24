const { redisConfig } = require('../config');
const Redis = require('ioredis');
const {
  textPostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  singleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
  reelPostToFbPageFeed,
  storyVideoToFbPageFeed,
  storyImageToFbPageFeed, updatePostStatus
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

    console.log(type)

    if (type === 'text') {
      textPostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        message: text,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from fb')

      }).catch(async err => {
        console.log(err.message)
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })
    }

    if (type === 'textWithImage') {

      const imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

      singleImagePostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        imageUrl,
        caption: text,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from fb')

      }).catch(async err => {
        console.log(err.message)
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }


    if (type === 'textWithMultipleImage') {

      const imageUrl = !!imageUrls ? JSON.parse(imageUrls) : ''

      console.log(imageUrl, 'llllll')

      multipleImagePostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        imageUrls,
        caption: text
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from fb')

      }).catch(async err => {
        console.log(err.message)
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

    if (type === 'videoFBPage') {

      const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      videoPostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        videoUrl,
        description: text, // The optional description for the video.
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from fb')

      }).catch(async err => {
        console.log(err.message)
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }


    if (type === 'reelToPage') {

      const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      reelPostToFbPageFeed({
        accessToken: pageToken,
        pageId,
        videoUrl,
        description: text,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from fb')

      }).catch(async err => {
        console.log(err.message)
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

    if (type === 'storyVideoToPage') {

      const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      storyVideoToFbPageFeed({
        accessToken: pageToken,
        pageId,
        videoUrl,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from fb')

      }).catch(async err => {
        console.log(err.message)
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })
    }

    if (type === 'storyImageToPage') {

      const imageUrl = !!videoUrls ? JSON.parse(imageUrl)[0] : ''

      storyImageToFbPageFeed({
        accessToken: pageToken,
        pageId,
        imageUrl,
        caption: text,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from fb')

      }).catch(async err => {
        console.log(err.message)
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

  }
  catch (e) {
    console.log('error while posting to the page', e.message)
  }


});
