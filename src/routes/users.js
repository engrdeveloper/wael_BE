// Routes for user operations
const express = require("express");
const router = express.Router();
const userController = require("../controllers/users");
const { auth } = require("../middlewares/auth");

// POST /api/users - Adds a new user
router.post("/", userController.addUser);

// GET /api/users/:id - Retrieves a user by ID
router.get("/:id", auth, userController.getOneUser);

// PUT /api/users/:id - Updates a user by ID
router.put("/:id", auth, userController.updateUser);

// DELETE /api/users/:id - Deletes a user by ID
router.delete("/:id", auth, userController.deleteUser);

// POST /api/users/login - Authenticates a user by their email and password
router.post("/login", userController.login);

// POST /api/users/login-with-google - Authenticates a user by their Google account
router.post("/login-with-google", userController.loginWithGoogle)

// GET /api/users/email/:emailPrefix - Retrieves users whose email starts with :emailPrefix
router.get("/email/:emailPrefix", auth, userController.getUsersByEmailPrefix);

// POST /api/users/forget - Sends a password reset email to the user with the given email
router.post("/forget", userController.forgetPass);

// POST /api/users/updatePass - Updates the password of the user with the given token
router.post("/updatePass", auth, userController.updatePass);

module.exports = router;
