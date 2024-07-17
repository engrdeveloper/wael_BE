// User Pages API routes
const express = require("express");
const router = express.Router();
const userPageController = require("../controllers/userPages");
const { auth } = require("../middlewares/auth");

// POST /userPages - Adds a new user page
router.post("/", auth, userPageController.addPage);

// GET /userPages/:id - Retrieves a user Page by its ID
router.get("/:id", auth, userPageController.getOnePage);

// PUT /userPages/:id - Updates a user Page by its ID
router.put("/:id", auth, userPageController.updatePage);

// DELETE /userPages/:id - Deletes a user Page by its ID
router.delete("/:id", auth, userPageController.deletePage);

router.post("/invite", userPageController.invite);

module.exports = router;
