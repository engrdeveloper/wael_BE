// User Channels API routes
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userChannels");
const { auth } = require("../middlewares/auth");

// POST /userChannels - Adds a new user channel
router.post("/", auth, userController.addChannel);

// GET /userChannels/:id - Retrieves a user channel by its ID
router.get("/:id", auth, userController.getOneChannel);

// PUT /userChannels/:id - Updates a user channel by its ID
router.put("/:id", auth, userController.updateChannel);

// DELETE /userChannels/:id - Deletes a user channel by its ID
router.delete("/:id", auth, userController.deleteChannel);

module.exports = router;
