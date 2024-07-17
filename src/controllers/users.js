const userService = require("../services/users");
const bcrypt = require("bcrypt");
const Jwt = require("jsonwebtoken");

/**
 * Adds a new user to the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.addUser = async (req, res) => {
  try {
    // Get the user data from the request body
    const { email, password } = req.body;

    // If any of the required fields are missing, return an error response
    if (!email || !password) {
      return res.status(500).json({
        success: false,
        error: { message: "All fields are required" },
      });
    }

    // Add the user to the database
    await userService.addUser({ email, password });

    res
      .status(200)
      .json({ success: true, message: "User Created Successfully" });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves a user from the database by their ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getOneUser = async (req, res) => {
  try {
    // Get the user ID from the request parameters
    const userId = req.params.id;

    // If no user ID is provided, return an error response
    if (!userId) {
      return res
        .status(500)
        .json({ success: false, error: { message: "User ID is required" } });
    }

    // Get the user from the database by their ID
    const user = await userService.getOneUser(userId);

    // If no user is found, return a success response with a message
    if (!user) {
      return res
        .status(200)
        .json({ success: false, message: "User Not Found" });
    }

    // Return the user as a success response
    res.status(200).json(user);
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Updates a user in the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.updateUser = async (req, res) => {
  try {
    // Get the user ID from the request parameters
    const userId = req.params.id;

    // Get the email and password from the request body
    const { email, password } = req.body;

    // Check if neither email nor password is provided
    if (!email && !password) {
      return res
        .status(500)
        .json({ success: false, error: { message: "Provide data to update" } });
    }

    let updatedUser = null;

    // If email is provided, update the user with the new email and password
    if (email) {
      updatedUser = await userService.updateUser(userId, { email, password });
    }
    // If only password is provided, update the user with the new password
    else {
      updatedUser = await userService.updateUser(userId, { email, password });
    }

    // If no user is found, return a success response with a message
    if (!updatedUser) {
      return res
        .status(200)
        .json({ success: false, message: "User Not Found" });
    }

    // Return the updated user as a success response
    res.status(200).json({ success: true, data: { updatedUser } });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Deletes a user from the database by their ID.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.deleteUser = async (req, res) => {
  try {
    // Get the user ID from the request parameters
    const userId = req.params.id;

    // If no user ID is provided, return an error response
    if (!userId) {
      return res
        .status(500)
        .json({ success: false, error: { message: "User ID is required" } });
    }

    // Delete the user from the database by their ID
    const deletedUser = await userService.deleteUserById(userId);

    // If no user is found, return a success response with a message
    if (!deletedUser) {
      return res
        .status(200)
        .json({ success: false, message: "User Not Found" });
    }

    // Return the success response indicating that the user was deleted
    res
      .status(200)
      .json({ success: true, message: "User Deleted Successfully" });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Authenticates a user by their email and password and returns a JSON Web Token (JWT).
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.login = async (req, res) => {
  try {
    // Get the email and password from the request body
    const { email, password } = req.body;

    // If email or password is missing, return an error response
    if (!email || !password) {
      return res.status(500).json({
        success: false,
        error: { message: "Email and password are required" },
      });
    }

    // Get the user from the database by their email
    const user = await userService.getUserByEmail(email);

    // If user is not found, return an error response
    if (!user) {
      return res
        .status(500)
        .json({ success: false, error: { message: "Invalid Credentials" } });
    }

    // Check if the provided password matches the user's password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    // If password is invalid, return an error response
    if (!isPasswordValid) {
      return res
        .status(401)
        .json({ success: false, error: { message: "Invalid Credentials" } });
    }

    // Generate a JSON Web Token (JWT) with the user's ID and email
    const token = Jwt.sign(
      { userId: user.id, email: user.email },
      "NODEAPI@123"
    );

    // Return a success response with the token, a message, and the user object
    res
      .status(200)
      .json({ token, success: true, message: "User Login Successfully", user });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Authenticates a user using Google Sign-In and returns a JSON Web Token (JWT).
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.loginWithGoogle = async (req, res) => {
  try {
    // Retrieve the Google Sign-In token from the request body
    const { credential: token } = req.body;

    // If the token is missing, return an error response
    if (!token) {
      res.status(400).json({ message: "Missing access token." });
      return;
    }

    // Decode the Google Sign-In token
    const googleUser = Jwt.decode(token);

    // Extract the email from the decoded token
    const { email } = googleUser;

    // Retrieve the user from the database by their email
    let user = await userService.getUserByEmail(email);

    // If the user does not exist, create a new user
    if (!user) {
      await userService.addUser({ email, password: "google" });

      user = await userService.getUserByEmail(email);
    }

    // Generate a JSON Web Token (JWT) with the user's ID and email
    const jwtToken = Jwt.sign(
      { userId: user.id, email: user.email },
      "NODEAPI@123"
    );

    // Return a success response with the token, a message, and the user object
    res.status(200).json({
      success: true,
      message: "User verified Successfully",
      token: jwtToken,
      user,
    });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves users from the database whose email starts with a given prefix.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getUsersByEmailPrefix = async (req, res) => {
  try {
    // Get the email prefix from the request parameters
    const emailPrefix = req.params.emailPrefix;

    // If no email prefix is provided, return an error response
    if (!emailPrefix) {
      return res.status(500).json({ error: "Email prefix is required" });
    }

    // Get the users from the database whose email starts with the given email prefix
    const users = await userService.getUsersByEmailPrefix(emailPrefix);

    // If no users are found, return a success response with a message
    if (!users.length) {
      return res
        .status(404)
        .json({ error: "No users found with the given email prefix" });
    }

    // Return the users as a success response
    res.status(200).json({ success: true, data: { users } });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Sends a password reset email to the user with the given email.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.forgetPass = async (req, res) => {
  try {
    // Get the email from the request body
    const { email } = req.body;

    // If email is missing, return an error response
    if (!email) {
      return res
        .status(500)
        .json({ success: false, error: { message: "Email are required" } });
    }

    // Send a password reset email to the user with the given email
    const user = await userService.forgetPass(email);

    // If user is not found, return an error response
    if (!user) {
      return res
        .status(500)
        .json({ success: false, error: { message: "Invalid Email" } });
    }

    // Return a success response with a message
    res.status(200).json({ success: true, message: "Email sent" });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Updates the password of the user with the given token.
 *
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.updatePass = async (req, res) => {
  try {
    // Get the new password from the request body
    const { password } = req.body;

    // If password is missing, return an error response
    if (!password) {
      return res
        .status(500)
        .json({ success: false, error: { message: "Provide data to update" } });
    }

    // Update the user with the new password using the user ID from the request token
    let updatedUser = await userService.updateUser(req?.user?.userId, {
      password,
    });

    // If no user is found, return a success response with a message
    if (!updatedUser) {
      return res
        .status(200)
        .json({ success: false, message: "User Not Found" });
    }

    // Return the updated user as a success response
    res.status(200).json({ success: true, data: { updatedUser } });
  } catch (error) {
    // If an error occurs, return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

/**
 * Retrieves a single Page from the database.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @returns {Promise<void>}
 */
exports.getPagesByUserId = async (req, res) => {
  try {
    // Get the pages ID from the request parameters
    const user = req.params.userId;

    // Check if the page ID is missing
    if (!user) {
      return res.status(500).json({
        success: false,
        error: { message: "User ID is required" },
      });
    }

    // Retrieve the page from the database
    const page = await userService.getPagesWithUserId(user);

    // Check if the channel is not found
    if (!page) {
      return res
          .status(200)
          .json({ success: false, message: "User Channel Not Found" });
    }

    // Return the channel as a success response
    res.status(200).json({ success: true, data: { page } });
  } catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};

exports.getPagesByMainUserId = async (req, res) => {
  try {
    // Get the pages ID from the request parameters
    const user = req.params.mainUserId;

    // Check if the page ID is missing
    if (!user) {
      return res.status(500).json({
        success: false,
        error: { message: "User ID is required" },
      });
    }

    // Retrieve the page from the database
    const page = await userService.getPagesWithMainUserId(user);

    // Check if the channel is not found
    if (!page) {
      return res
          .status(200)
          .json({ success: false, message: "User Channel Not Found" });
    }

    // Return the channel as a success response
    res.status(200).json({ success: true, data: { page } });
  } catch (error) {
    // Return an error response with details
    res.status(500).json({
      success: false,
      error: { message: "Something went wrong", reason: error.message },
    });
  }
};