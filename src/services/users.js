const db = require("../models");
const { Op, where } = require("sequelize");
const bcrypt = require("bcrypt");
const nodemailer = require("nodemailer");
const Jwt = require("jsonwebtoken");
const { emailService, hostname } = require("../config/index");

/**
 * Sends an email to the user with a password reset link.
 * @param {Object} user - The user object.
 * @param {string} token - The password reset token.
 * @returns {Promise<boolean>} - A promise that resolves to true if the email was sent successfully, false otherwise.
 */
async function sendPasswordResetEmail(user, token) {
  const transporter = await nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailService.user,
      pass: emailService.pass,
    },
  });

  const resetLink = `${ hostname }/password-reset/${ user.id }/${ token }`;

  const mailOptions = {
    from: emailService.from,
    to: user.email,
    subject: "Password Reset Request",
    text: `Click on the following link to reset your password: ${ resetLink }`,
  };

  return transporter
    .sendMail(mailOptions)
    .then((r) => {
      console.log("Email sent:", r);
      return true;
    })
    .catch((err) => {
      console.log("Email failed:", err.message);
      return false;
    });
}

/**
 * Adds a new user to the database.
 * @param {Object} userData - The user data object containing the email and password.
 * @returns {Promise<Object>} - A promise that resolves to the created user object.
 */
exports.addUser = async ({ email, password }) => {
  const hashedPassword = await bcrypt.hash(password, 10);
  return db.User.create({ email, password: hashedPassword });
};

/**
 * Retrieves a user from the database by their email.
 * @param {string} email - The email of the user.
 * @returns {Promise<Object|null>} - A promise that resolves to the user object or null if not found.
 */
exports.getUserByEmail = async (email) => {
  return await db.User.findOne({ where: { email: email } });
};

/**
 * Retrieves a user from the database by their ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object|null>} - A promise that resolves to the user object or null if not found.
 */
exports.getOneUser = async (userId) => {
  return db.User.findByPk(userId);
};

/**
 * Updates a user in the database.
 * @param {string} userId - The ID of the user.
 * @param {Object} userData - The data to update the user with.
 * @param {string} [userData.email] - The new email for the user.
 * @param {string} [userData.password] - The new password for the user.
 * @returns {Promise<Object|null>} - A promise that resolves to the updated user object or null if not found.
 */
exports.updateUser = async (userId, { email, password }) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    return null;
  }

  if (email) {
    await user.update({ email });
  }
  if (password) {
    const hashedPassword = await bcrypt.hash(password, 10);

    await user.update({ password: hashedPassword });
  }

  return user;
};

/**
 * Deletes a user from the database by their ID.
 * @param {string} userId - The ID of the user.
 * @returns {Promise<Object|null>} - A promise that resolves to the deleted user object or null if not found.
 */
exports.deleteUserById = async (userId) => {
  const user = await db.User.findByPk(userId);
  if (!user) {
    return null;
  }
  return user.destroy();
};

/**
 * Authenticates a user by their email and password.
 * @param {string} email - The email of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<Object|null>} - A promise that resolves to the user object or null if authentication fails.
 */
exports.login = async (email, password) => {
  return db.User.findOne({ where: { email: email, password: password } });
};

/**
 * Retrieves users from the database whose email starts with a given prefix.
 * @param {string} emailPrefix - The prefix of the email.
 * @returns {Promise<Array<Object>>} - A promise that resolves to an array of user objects.
 */
exports.getUsersByEmailPrefix = async (emailPrefix) => {
  return db.User.findAll({
    where: {
      email: {
        [Op.like]: `${ emailPrefix }%`,
      },
    },
  });
};

/**
 * Sends a password reset email to the user with the given email.
 * @param {string} email - The email of the user.
 * @returns {Promise<boolean>} - A promise that resolves to true if the email was sent successfully, false otherwise.
 */
exports.forgetPass = async (email) => {
  const user = await db.User.findOne({ where: { email: email } });
  if (!user) return null;

  // Send password reset email
  const signedToken = Jwt.sign(
    { userId: user.id, email: user.email },
    "NODEAPI@123"
  );

  return sendPasswordResetEmail(user, signedToken);
};

exports.getPagesWithUserId = async (userId) => {
  return db.User.findOne({
    where: { id: userId },
    attributes: ['id'],
    include: [
      {
        model: db.Pages,
        as: "usersPages",
        through: { attributes: ['role', 'status'], where: { status: { [Op.ne]: 'pending' } } },
        attributes: ['pageId', 'name', 'id', 'channel']
      }
    ]
  })
};

exports.getPagesWithMainUserId = async (userId) => {
  return db.Pages.findAll({
    where: { userId: userId },
    attributes: ['name'],
    include: [
      {
        model: db.User,
        as: 'usersPages',
        attributes: ['email', 'id']
      },
    ]
  })
};