const db = require("../models");
const { Op } = require('sequelize');

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

exports.getPostsByPageId = async (pageId, status, page = 1) => {

  let where = {
    pageId
  }

  if (status === 'draft') {
    where = { ...where, status }
  }
  else if (status === 'sent') {
    where = { ...where, status, isApproved: true }
  }
  else if (status === 'approval') {
    where = { ...where, isApproved: false, status: { [Op.eq]: 'queued' }, }
  }

  const posts = await db.Posts.findAll({
    where,
    limit: 10,
    offset: (page - 1) * 10
  });


  const totalCounts = await db.Posts.count({
    where,
  });

  return { posts, totalCounts }

};

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
  const day = String(date.getDate()).padStart(2, '0');
  return `${ year }-${ month }-${ day }`;
}

function getTodayAnd7thDate() {
  const today = new Date();

  // Calculate the date 7 days from today
  const seventhDay = new Date(today);
  seventhDay.setDate(today.getDate() + 7);

  return {
    today: formatDate(today),
    seventhDay: formatDate(seventhDay)
  };
}

const groupByDay = async (pageId) => {

  const dates = getTodayAnd7thDate();

  const query = `
  SELECT
    DATE_FORMAT(postedDate, '%Y-%m-%d') as day,
    JSON_ARRAYAGG(
      JSON_OBJECT(
        'id', id,
        'text', text,
        'imageUrls', imageUrls,
        'createdAt', createdAt,
        'status', status,
        'isApproved', isApproved,
        'videoUrls', videoUrls,
        'postedDate',postedDate,
        'createdBy', createdBy,
        'pageId', pageId,
        'type', type,
        'createdByEmail', createdByEmail,
        'error', error
      )
    ) as records
  FROM
    Posts
  WHERE
    pageId = :pageId
     AND STR_TO_DATE(postedDate, '%Y-%m-%d') BETWEEN STR_TO_DATE(:startDate, '%Y-%m-%d') AND STR_TO_DATE(:endDate, '%Y-%m-%d')

  GROUP BY
    DATE_FORMAT(postedDate, '%Y-%m-%d')
  ORDER BY
    day ASC;
`;
  return db.sequelize.query(query, {
    replacements: { pageId, startDate: dates?.today, endDate: dates?.seventhDay },
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

exports.getTwoWeekPostsCountByUserId = async (userId) => {

  const twoWeeksAgo = new Date();
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  return db.Posts.count({
    where: {
      createdBy: userId,
      createdAt: {
        [Op.gte]: twoWeeksAgo,
      },
    },
  });
}

