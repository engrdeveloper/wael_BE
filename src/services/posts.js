const db = require("../models");
const { fn, col, Sequelize } = require('sequelize');

/**
 * Retrieves a post from the Pages table by its ID.
 * @param {string} postId - The ID of the post.
 * @returns {Promise<Object|null>} - A promise that resolves to the post object or null if not found.
 */
exports.getOnePostById = async (postId) => {
  return db.Posts.findByPk(postId);
};

/**
 * Retrieves a post from the Pages table by its ID.
 * @param {string} pageId - The ID of the post.
 * @returns {Promise<Object|null>} - A promise that resolves to the post object or null if not found.
 */

exports.getPostsByPageId = async (pageId, status) => {

  let where = {
    pageId
  }

  if (status !== 'both') {
    where = { ...where, status }
  }

  console.log(where, 'kkkkk')

  return db.Posts.findAll({
    where
  });
};

const groupByDay = async (pageId) => {

  const query = `
  SELECT
    DATE_FORMAT(createdAt, '%Y-%m-%d') as day,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', id,
        'text', text,
        'imageUrls', imageUrls,
        'createdAt', createdAt
      )
    ) as records
  FROM
    Posts
  WHERE
    pageId = :pageId
  GROUP BY
    DATE_FORMAT(createdAt, '%Y-%m-%d')
  ORDER BY
    day ASC;
`;
  return db.sequelize.query(query, {
    replacements: { pageId },
    type: db.sequelize.QueryTypes.SELECT
  });

};

const groupByWeek = async (pageId) => {

  const query = `
    SELECT
      YEAR(createdAt) as year,
      WEEKOFYEAR(createdAt) as week,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', id,
          'title', text,
          'start': createdAt,
          'end': createdAt
          'imageUrls', imageUrls,
          'createdAt', createdAt
        )
      ) as records
    FROM
      Posts
    WHERE
      pageId = :pageId
    GROUP BY
      year, week
    ORDER BY
      year ASC, week ASC;
  `;

  return db.sequelize.query(query, {
    replacements: { pageId },
    type: db.sequelize.QueryTypes.SELECT
  });

};

const groupByMonth = async (pageId) => {

  const query = `
    SELECT
      DATE_FORMAT(createdAt, '%Y-%m') as month,
      JSON_ARRAYAGG(
        JSON_OBJECT(
          'id', id,
          'text', text,
          'imageUrls', imageUrls,
          'createdAt', createdAt
        )
      ) as records
    FROM
      Posts
    WHERE
      pageId = :pageId
    GROUP BY
      month
    ORDER BY
      month ASC;
  `;

  return db.sequelize.query(query, {
    replacements: { pageId },
    type: db.sequelize.QueryTypes.SELECT
  });

};

/**
 * Retrieves a post from the Pages table by its ID.
 * @param {string} pageId - The ID of the post.
 @param {string} view - The Day, week, month wise view.
 * @returns {Promise<Object|null>} - A promise that resolves to the post object or null if not found.
 */
exports.getPostsByPageIdIntervals = async (pageId, view) => {

  if (view === 'day') {
    return groupByDay(pageId)
  }
  else if (view === 'month') {
    return groupByMonth(pageId)
  }
  else if (view === 'week') {
    return groupByWeek(pageId)
  }
  else {
    return []
  }
};

exports.deletePostById = async (postId) => {
  const post = await db.Posts.findByPk(postId);
  if (!post) {
    return null;
  }
  return post.destroy();
}
