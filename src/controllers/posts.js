const postService = require("../services/posts");
const { getOnePage } = require('../services/pages');
const { delKey, delKeyWithPattern, setKeyWithExpiry } = require('../utils/redis');
const {
  updatePostStatus,
  textPostToFbPageFeed,
  singleImagePostToFbPageFeed,
  multipleImagePostToFbPageFeed,
  videoPostToFbPageFeed,
  reelPostToFbPageFeed,
  storyVideoToFbPageFeed,
  storyImageToFbPageFeed, updatePostToDb
} = require('../services/facebookService');
const { getOnePostById } = require('../services/posts');
const {
  postImageToInstagramAccount,
  postCarouselToInstagramAccount,
  postVideoToInstagramAccount
} = require('../services/instagramService');
const path = require('path');
const {
  postTextToPageFeed,
  singleImagePostToLinkedinPageFeed,
  multipleImagePostToLinkedinPageFeed,
  videoPostToLinkedinPageFeed
} = require('../services/linkedinService');
const { TwitterApi } = require('twitter-api-v2');
const { twitterKey, twitterSecret } = require('../config');
const axios = require('axios');
const fs = require('fs');

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

const downloadVideo = async (videoUrl) => {
  // Make a GET request to the video URL and set the response type to "arraybuffer"
  const response = await axios.get(videoUrl, { responseType: "arraybuffer" });

  // Convert the response data to a Buffer and return it
  return Buffer.from(response.data, "binary");
};

/**
 * Retrieves a single post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getOnePostById = async (req, res) => {
  try {

    // Get the post ID from the request parameters
    const postId = req.params.id;

    // Check if the post ID is missing
    if (!postId) {
      return res.status(500).json({
        success: false,
        error: { message: "User Post ID is required" },
      });
    }

    // Retrieve the post from the database
    const post = await postService.getOnePostById(pageId);

    // Check if the post is not found
    if (!post) {
      return res
        .status(200)
        .json({ success: false, message: "User Post Not Found" });
    }

    // Return the post as a success response
    res.status(200).json({ success: true, data: { post } });

  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves a single post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getPostsByPageId = async (req, res) => {

  try {

    // Get the post ID from the request parameters
    const pageId = req.params.pageId;

    const status = req.params.status

    const filters = req?.query?.filters ? JSON.parse(req.query.filters) : {}

    // Check if the post ID is missing
    if (!pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "Page ID is required" },
      });
    }

    // Retrieve the post from the database
    const post = await postService.getPostsByPageId(pageId, status, filters?.page);

    // Check if the post is not found
    if (!post) {
      return res
        .status(200)
        .json({ success: false, message: "User Post Not Found" });
    }

    // Return the post as a success response
    res.status(200).json({ success: true, data: { ...post } });

  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves a single post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getPostsByPageIdIntervals = async (req, res) => {

  try {

    // Get the post ID from the request parameters
    const pageId = req.params.pageId;
    const view = req.params.view;

    // Check if the post ID is missing
    if (!pageId) {
      return res.status(500).json({
        success: false,
        error: { message: "Page ID is required" },
      });
    }

    // Retrieve the post from the database
    const post = await postService.getPostsByPageIdIntervals(pageId, view);

    // Check if the post is not found
    if (!post) {
      return res
        .status(200)
        .json({ success: false, message: "User Post Not Found" });
    }

    // Return the post as a success response
    res.status(200).json({ success: true, data: { post } });

  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Deletes a post from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.deletePostById = async (req, res) => {
  try {
    // Get the post ID from the request parameters
    const postId = req.params.id;

    const pageId = req.params.pageId

    // Check if the post ID is missing
    if (!postId || !pageId) {
      return res.status(500).json({ error: "Missing required parameters" });
    }

    await delKeyWithPattern(`${ pageId }:${ postId }`)

    // Delete the post from the database
    const deletedPost = await postService.deletePostById(postId);

    // Check if the post is not found
    if (!deletedPost) {
      return res
        .status(200)
        .json({ success: false, message: "Post Not Found" });
    }

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Post Deleted Successfully" });
  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

exports.approvePost = async (req, res) => {

  try {
    // Get the post ID from the request body

    const { postId, pageId, postType, shouldSchedule, scheduledSeconds } = req.body

    // Check if the post ID is missing
    if (!postId || !pageId) {
      return res.status(500).json({ error: "Missing required parameters" });
    }

    const getPageById = await getOnePage(pageId)

    const { pageToken } = getPageById

    if (!pageToken) {
      return res.status(400).json({ error: "Cannot find page" });
    }

    const status = await updatePostToDb(postId, { isApproved: true })

    if (shouldSchedule && scheduledSeconds) {
      await setKeyWithExpiry(`${ postType }:${ pageId }:${ postId }:${ pageToken }`, 'some value', scheduledSeconds)
    }
    else {

      const type = postType
      const post = await getOnePostById(postId)

      const { text, imageUrls, videoUrls } = post

      console.log(type)

      if (type === 'text') {

        return textPostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          message: text,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from fb')

          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message)
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res
            .status(500)
            .json({ success: false, error: { reason: err.message } });
        })
      }

      if (type === 'textWithImage') {

        const imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

        return singleImagePostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          imageUrl,
          caption: text,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from fb')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message)
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res
            .status(500)
            .json({ success: false, error: { reason: err.message } });
        })

      }

      if (type === 'textWithMultipleImage') {

        const imageUrl = !!imageUrls ? JSON.parse(imageUrls) : ''

        return multipleImagePostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          imageUrl,
          caption: text
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from fb')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message)
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res
            .status(500)
            .json({ success: false, error: { reason: err.message } });
        })

      }

      if (type === 'videoFBPage') {

        const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

        return videoPostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          videoUrl,
          description: text, // The optional description for the video.
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from fb')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message)
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res
            .status(500)
            .json({ success: false, error: { reason: err.message } });
        })

      }

      if (type === 'reelToPage') {

        const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

        return reelPostToFbPageFeed({
          accessToken: pageToken,
          pageId,
          videoUrl,
          description: text,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from fb')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message)
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res
            .status(500)
            .json({ success: false, error: { reason: err.message } });
        })

      }

      if (type === 'storyVideoToPage') {

        const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

        return storyVideoToFbPageFeed({
          accessToken: pageToken,
          pageId,
          videoUrl,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from fb')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });
        }).catch(async err => {
          console.log(err.message)
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res
            .status(500)
            .json({ success: false, error: { reason: err.message } });
        })
      }

      if (type === 'storyImageToPage') {

        const imageUrl = !!videoUrls ? JSON.parse(imageUrl)[0] : ''

        return storyImageToFbPageFeed({
          accessToken: pageToken,
          pageId,
          imageUrl,
          caption: text,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from fb')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });
        }).catch(async err => {
          console.log(err.message)
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res
            .status(500)
            .json({ success: false, error: { reason: err.message } });
        })

      }

      if (type === 'instaTextWithImage') {

        const imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

        return postImageToInstagramAccount({
          igUserId: pageId,
          accessToken: pageToken,
          imageUrl,
          caption: text,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from instagram')

          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from instagram')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })

      }

      if (type === 'instaTextWithMultipleImage') {

        let imageUrl = !!imageUrls ? JSON.parse(imageUrls) : ''

        imageUrl = imageUrl.map(url => {
          return { type: 'image', imageUrl: url }
        })

        return postCarouselToInstagramAccount({
          igUserId: pageId,
          accessToken: pageToken,
          mediaItems: imageUrl,
          caption: text,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from insta')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from insta')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })

      }

      if (type === 'instaVideoFBPage') {

        let videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

        return postVideoToInstagramAccount({
          media_type: "REELS",
          igUserId: pageId,
          accessToken: pageToken,
          videoUrl,
          caption: text,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from insta')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from insta')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })

      }

      if (type === 'instaStoryImageToPage') {

        let imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

        return postImageToInstagramAccount({
          igUserId: pageId,
          accessToken: pageToken,
          imageUrl,
          mediaTypeStory: true,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from insta')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from insta')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })

      }

      if (type === 'instaStoryVideoToPage') {

        let videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

        return postVideoToInstagramAccount({
          media_type: "STORIES",
          igUserId: pageId,
          accessToken: pageToken,
          videoUrl,
        }).then(async fbResp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(fbResp, 'response from insta')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from insta')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
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
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }
        catch (err) {
          console.log(err.message, 'error from twitter')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
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
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }
        catch (err) {
          console.log(err.message, 'error from twitter')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
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

          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }
        catch (err) {
          console.log(err.message, 'error from twitter')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
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

          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }
        catch (error) {

          console.log(error.message, 'error from twitter')

          const status = await updatePostStatus(postId, 'not sent', error.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: error.message },
          });
        }

      }

      if (type === 'linkedinText') {
        return postTextToPageFeed(pageToken, pageId, text).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(resp, 'response from linkedin')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from linkedin')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })
      }

      if (type === 'linkedinTextWithImage') {

        const imageUrl = !!imageUrls ? JSON.parse(imageUrls)[0] : ''

        return singleImagePostToLinkedinPageFeed(
          pageToken,
          pageId,
          imageUrl,
          text
        ).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(resp, 'response from linkedin')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from linkedin')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })

      }

      if (type === 'linkedinTextWithMultipleImage') {

        const imageUrl = !!imageUrls ? JSON.parse(imageUrls) : ''

        console.log(imageUrl, 'llllll')

        return multipleImagePostToLinkedinPageFeed(
          pageToken,
          pageId,
          imageUrl,
          text
        ).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(resp, 'response from linkedin')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from linkedin')
          const status = await updatePostStatus(postId, 'not sent', err.message)
          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })

      }

      if (type === 'linkedinVideoPage') {

        const videoUrl = !!videoUrls ? JSON.parse(videoUrls)[0] : ''

        const videoBuffer = await downloadVideo(videoUrl);

        return videoPostToLinkedinPageFeed(
          pageToken,
          pageId,
          videoBuffer,
          text
        ).then(async resp => {
          const status = await updatePostStatus(postId, 'sent')
          console.log(resp, 'response from linkedin')
          return res
            .status(200)
            .json({ success: true, message: "Post Approved Successfully" });

        }).catch(async err => {
          console.log(err.message, 'error from linkedin')
          const status = await updatePostStatus(postId, 'not sent', err.message)

          return res.status(500).json({
            success: false,
            error: { message: "Something went wrong", reason: err.message },
          });
        })

      }

    }


    // Return a success response
    return res
      .status(200)
      .json({ success: true, message: "Post Approved Successfully" });
  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

exports.rejectPost = async (req, res) => {
  try {
    // Get the post ID from the request parameters
    const postId = req.params.id;

    // Check if the post ID is missing
    if (!postId) {
      return res.status(500).json({ error: "Missing required parameters" });
    }
    const rejectedPost = await updatePostStatus(postId, 'rejected');

    // Check if the post is not found
    if (!rejectedPost) {
      return res
        .status(200)
        .json({ success: false, message: "Post Not Found" });
    }

    // Return a success response
    res
      .status(200)
      .json({ success: true, message: "Post Rejected Successfully" });
  }
  catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};