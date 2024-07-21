const db = require("../models");
const nodemailer = require("nodemailer");
const { emailService, hostname } = require("../config");
const Jwt = require("jsonwebtoken");
const { getOneUser } = require("./users");

/**
 * Adds a page to the UserPages table.
 * @param {string} userId - The ID of the user.
 * @param {string} role - The role of the user in the page.
 * @param {string} pageId - The ID of the page.
 * @returns {Promise<Object>} - A promise that resolves to the created page object.
 */
exports.addUserPage = async (userId, role, pageId) => {

  const user = await getOneUser(userId)

  if (!user) {
    return false
  }

  let userEmail = user?.dataValues?.email

  const page = {
    userId: user?.dataValues?.id,
    role,
    pageId,
    userEmail
  }

  return db.UserPages.findOrCreate({
    where: { userId: page.userId, role: page.role, pageId: page.pageId },
    defaults: page
  });
};

/**
 * Retrieves a page from the UserPages table by its ID.
 * @param {string} pageId - The ID of the page.
 * @returns {Promise<Object|null>} - A promise that resolves to the page object or null if not found.
 */
exports.getOneUserPage = async (pageId) => {
  return db.UserPages.findByPk(pageId);
};

/**
 * Updates a page in the UserChannels table.
 * @param {string} pageId - The ID of the page.
 * @param {Object} updateData - The data to update the page with.
 * @param {string} updateData.role - The role of the user in the page.
 * @returns {Promise<Object|null>} - A promise that resolves to the updated page object or null if not found.
 */
exports.updateUserChannel = async (pageId, { role }) => {
  const channel = await db.UserPages.findByPk(pageId);
  if (!channel) {
    return null;
  }
  await channel.update({ role });
  return channel;
};

/**
 * Deletes a page from the UserChannels table by its ID.
 * @param {string} pageId - The ID of the page.
 * @returns {Promise<Object|null>} - A promise that resolves to the deleted page object or null if not found.
 */
exports.deleteUserPageById = async (pageId) => {
  const channel = await db.UserPages.findByPk(pageId);
  if (!channel) {
    return null;
  }
  return channel.destroy();
};

exports.invite = async (email, pageId, mainUserId, role) => {
  const user = await db.User.findOne({ where: { email: email } });
  if (!user) return null;

  return sendPageInvite(user, pageId, mainUserId, role);
};

async function sendPageInvite(user, pageId, mainUserId, role) {

  const transporter = await nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: emailService.user,
      pass: emailService.pass,
    },
  });

  const inviteLink = `${ hostname }/invitation/${ user.id }/${ pageId }/${ mainUserId }/${ role }`;

  const mailOptions = {
    from: emailService.from,
    to: user.email,
    subject: "Password Reset Request",
    text: `Click on this link to accept invite: ${ inviteLink }`,
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

