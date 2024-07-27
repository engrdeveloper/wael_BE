const { redisConfig, twitterKey, twitterSecret } = require('../config');
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
const {
  postImageToInstagramAccount,
  postCarouselToInstagramAccount,
  postVideoToInstagramAccount
} = require('../services/instagramService');
const { TwitterApi } = require('twitter-api-v2');
const path = require('path');
const axios = require('axios');
const fs = require('fs');

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

const twitterApiClient = (accessToken, accessTokenSecret) => {
  return new TwitterApi({
    appKey: twitterKey,
    appSecret: twitterSecret,
    accessToken: accessToken,
    accessSecret: accessTokenSecret,
  });
};

async function downloadMedia(url, filePath) {
  // Send a GET request to the media URL with the response type set to "stream"
  const response = await axios({
    url,
    responseType: "stream",
  });

  // Create a write stream to the specified file path
  return new Promise((resolve, reject) => {
    const writer = fs.createWriteStream(filePath);
    // Pipe the response data to the write stream
    response.data.pipe(writer);
    // Resolve the Promise when the writing is finished
    writer.on("finish", resolve);
    // Reject the Promise if there is an error during writing
    writer.on("error", reject);
  });
}

async function ensureDirectoryExists(directory) {
  // Return a Promise that resolves when the directory is created
  return new Promise((resolve, reject) => {
    // Attempt to create the directory with the "recursive" option set to true
    fs.mkdir(directory, { recursive: true }, (err) => {
      // If there is an error, reject the Promise with the error
      if (err) {
        reject(err);
      }
      else {
        // If the directory is created successfully, resolve the Promise
        resolve();
      }
    });
  });
}

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

      const imageUrl = !!videoUrls ? JSON.parse(imageUrls)[0] : ''

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

    if (type === 'instaTextWithImage') {

      const imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

      postImageToInstagramAccount({
        igUserId: pageId,
        accessToken: pageToken,
        imageUrl,
        caption: text,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from instagram')

      }).catch(async err => {
        console.log(err.message, 'error from instagram')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

    if (type === 'instaTextWithMultipleImage') {

      let imageUrl = !!imageUrls ? JSON.parse(imageUrls) : ''

      imageUrl = imageUrl.map(url => {
        return { type: 'image', imageUrl: url }
      })

      console.log(imageUrl, 'llllll')

      postCarouselToInstagramAccount({
        igUserId: pageId,
        accessToken: pageToken,
        mediaItems: imageUrl,
        caption: text,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from insta')

      }).catch(async err => {
        console.log(err.message, 'error from insta')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

    if (type === 'instaVideoFBPage') {

      let videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      postVideoToInstagramAccount({
        media_type: "REELS",
        igUserId: pageId,
        accessToken: pageToken,
        videoUrl,
        caption: text,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from insta')

      }).catch(async err => {
        console.log(err.message, 'error from insta')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

    if (type === 'instaStoryImageToPage') {

      let imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

      postImageToInstagramAccount({
        igUserId: pageId,
        accessToken: pageToken,
        imageUrl,
        mediaTypeStory: true,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from insta')

      }).catch(async err => {
        console.log(err.message, 'error from insta')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

    if (type === 'instaStoryVideoToPage') {

      let videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      postVideoToInstagramAccount({
        media_type: "STORIES",
        igUserId: pageId,
        accessToken: pageToken,
        videoUrl,
      }).then(async fbResp => {
        const status = await updatePostStatus(postId, 'sent')
        console.log(fbResp, 'response from insta')

      }).catch(async err => {
        console.log(err.message, 'error from insta')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      })

    }

    if (type === 'twitterText') {

      try {

        let accessToken = pageToken.split('@')[0]

        let accessTokenSecret = pageToken.split('@')[1]

        const client = await twitterApiClient(accessToken, accessTokenSecret);

        // Make the request
        const response = await client.v2.tweet({ text: text });

        const status = await updatePostStatus(postId, 'sent')
        console.log(response?.data, 'response from twitter')

      }
      catch (err) {
        console.log(err.message, 'error from twitter')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      }
    }

    if (type === 'twitterTextWithImage') {

      try {

        const imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

        let accessToken = pageToken.split('@')[0]

        let accessTokenSecret = pageToken.split('@')[1]

        // Create the assets directory if it doesn't exist
        const assetsPath = path.join(__dirname, "..", "assets");

        await ensureDirectoryExists(assetsPath);

        // Set the file path for the downloaded image
        const filePath = path.resolve(assetsPath, "twitter_image.jpg");

        // Download the image from the provided URL
        await downloadMedia(imageUrl, filePath);

        // Instantiate the Twitter API client
        const client = await twitterApiClient(accessToken, accessTokenSecret);

        // Upload the image to Twitter and get the media ID
        const mediaId = await client.v1.uploadMedia(filePath);

        // Make the request to post the tweet with the image
        const response = await client.v2.tweet({
          text: text,
          media: {
            media_ids: [mediaId],
          },
        });

        // Make the request
        const status = await updatePostStatus(postId, 'sent')
        console.log(response?.data, 'response from twitter')

      }
      catch (err) {
        console.log(err.message, 'error from twitter')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      }
    }

    if (type === 'twitterTextWithMultipleImage') {

      try {

        const images = !!imageUrls ? JSON.parse(imageUrls) : ''

        let accessToken = pageToken.split('@')[0]

        let accessTokenSecret = pageToken.split('@')[1]

        // Create the assets directory if it doesn't exist
        const assetsPath = path.join(__dirname, "..", "assets");

        await ensureDirectoryExists(assetsPath);

        // Instantiate the Twitter API client
        const client = await twitterApiClient(accessToken, accessTokenSecret);

        let imageUrl = images.map(url => {

          if (url.includes('.mp4')) {
            return { type: 'video', imageUrl: url }
          }
          return { type: 'image', imageUrl: url }
        })

        // Process the image one by one
        const mediaIds = await Promise.all(
          imageUrl.map(async (media) => {
            if (media?.type === "image") {
              // Set the file path for the downloaded image
              const filePath = path.resolve(assetsPath, "twitter_image.jpg");
              // Download the image from the provided URL
              await downloadMedia(media.imageUrl, filePath);
              // Upload the image to Twitter and get the media ID
              const mediaId = await client.v1.uploadMedia(filePath);
              return mediaId;
            }
            else {
              // Set the file path for the downloaded image
              const filePath = path.resolve(assetsPath, "twitter_video.mp4");
              // Download the image from the provided URL
              await downloadMedia(media.videoUrl, filePath);
              // Upload the image to Twitter and get the media ID
              const mediaId = await client.v1.uploadMedia(filePath);
              return mediaId;
            }
          })
        );

        // Make the request to post the tweet with the image
        const response = await client.v2.tweet({
          text: text,
          media: {
            media_ids: mediaIds,
          },
        });

        const status = await updatePostStatus(postId, 'sent')

        console.log(response?.data, 'response from twitter')

      }
      catch (err) {
        console.log(err.message, 'error from twitter')
        const status = await updatePostStatus(postId, 'not sent', err.message)
      }
    }

    if (type === 'twitterVideoPage') {

      const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

      try {

        let accessToken = pageToken.split('@')[0]

        let accessTokenSecret = pageToken.split('@')[1]

        const assetsPath = path.join(__dirname, "..", "assets");

        await ensureDirectoryExists(assetsPath);

        // Set the file path for the downloaded video
        const filePath = path.resolve(assetsPath, "twitter_video.mp4");

        // Download the video from the provided URL
        await downloadMedia(videoUrl, filePath);

        // Instantiate the Twitter API client
        const client = twitterApiClient(accessToken, accessTokenSecret);

        // Upload the video to Twitter and get the media ID
        const mediaId = await client.v1.uploadMedia(filePath);

        // Make the request to post the tweet with the video
        const response = await client.v2.tweet({
          text,
          media: {
            media_ids: [mediaId],
          },
        });

        const status = await updatePostStatus(postId, 'sent')
        console.log(response?.data, 'response from twitter')

      }
      catch (error) {

        console.log(error.message, 'error from twitter')

        const status = await updatePostStatus(postId, 'not sent', error.message)

      }

    }


  }
  catch (e) {
    console.log('error while posting to the page', e.message)
  }


});
