const db = require("../models");

/**
 * Adds a page to the Pages table.
 * @param {string} pageId - The ID of the FB page.
 * @param {string} pageToken - The token to access page.
 * @param {string} name - The name of page.
 * @param {string} userToken - The user token to access all pages.
 * @param {string} userId - The user token to access all pages.
 * @param {string} channel - The channel of pages.
 * @returns {Promise<Object>} - A promise that resolves to the created page object.
 */
exports.addPage = async (pageId, pageToken, name, userToken, userId, channel) => {
  return db.Pages.findOrCreate({ where: { pageId }, defaults: { pageToken, name, userToken, userId, channel } });
};

/**
 * Retrieves a page from the Pages table by its ID.
 * @param {string} pageId - The ID of the page.
 * @returns {Promise<Object|null>} - A promise that resolves to the page object or null if not found.
 */
exports.getOnePage = async (pageId) => {
  return db.Pages.findOne({ pageId });
};

/**
 * Updates a page in the Pages table.
 * @param {string} pageId - The ID of the page.
 * @param {Object}  - The data to update the page with.
 * @param {string} userId - The ID of the user.
 * @param {string} role - The role of the user in the page.
 * @param {string} mainUserId - The ID of the main user.
 * @returns {Promise<Object|null>} - A promise that resolves to the updated page object or null if not found.
 */
exports.updatePage = async (pageId, userId, role, mainUserId) => {
  const page = await db.Pages.findByPk(pageId);
  if (!page) {
    return null;
  }
  await page.update({ userId, role, mainUserId });
  return page;
};

/**
 * Deletes a page from the Pages table by its ID.
 * @param {string} pageId - The ID of the page.
 * @returns {Promise<Object|null>} - A promise that resolves to the deleted page object or null if not found.
 */
exports.deletePageById = async (pageId) => {
  const page = await db.Pages.findByPk(pageId);
  if (!page) {
    return null;
  }
  return page.destroy();
};