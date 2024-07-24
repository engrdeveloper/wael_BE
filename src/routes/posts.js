// User Posts API routes
const express = require("express");
const router = express.Router();
const postController = require("../controllers/posts");
const { auth } = require("../middlewares/auth");

// GET /posts/:id - Retrieves a post by its ID
router.get("/:id", auth, postController.getOnePostById);

// GET /posts/:pageId - Retrieves a posts by its pageId
router.get("/page/:pageId/:status", auth, postController.getPostsByPageId);

// GET /posts/:pageId/:interval - Retrieves a posts by its pageId and day, week month wise
router.get("/page/:pageId/view/:view", auth, postController.getPostsByPageIdIntervals);

// // DELETE /posts/:id - Deletes a user Post by its ID
router.delete("/:id/:pageId", auth, postController.deletePostById);

router.post('/approve', auth, postController.approvePost)

router.put('/reject/:id', auth, postController.rejectPost)


module.exports = router;
