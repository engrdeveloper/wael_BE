const Jwt = require("jsonwebtoken");

/**
 * Middleware function to authenticate the user.
 * Checks if the user is authenticated by verifying the token in the request headers.
 * If the token is valid, it adds the decoded token and the token itself to the request object.
 * If the token is invalid or not provided, it returns a 401 Unauthorized response.
 * @param {Object} req - The request object.
 * @param {Object} res - The response object.
 * @param {Function} next - The next middleware function.
 */
exports.auth = async (req, res, next) => {
  const token = req.headers["authorization"];

  if (!!token) {
    // Verify the token
    let verifyToken = Jwt.verify(token, "NODEAPI@123");

    if (verifyToken) {
      // Add the decoded token and the token itself to the request object
      req.token = token;
      req.user = Jwt.decode(token);
    }

    next();
  } else {
    // Return a 401 Unauthorized response if the token is not provided
    return res
      .status(401)
      .json({ success: false, error: { message: "Unauthorized" } });
  }
};
