const db = require("../models");

exports.addSubscription = async (userId, plan, subscriptionId, current_period_start, current_period_end, customerId) => {
  return db.Subscriptions.findOrCreate({
    where: { userId },
    defaults: { plan, subscriptionId, current_period_start, current_period_end, status: 'active', customerId }
  });
};

exports.getOneSubscription = async (userId) => {
  return db.Subscriptions.findOne({ plain: true, where: { userId: userId, status: 'active' } });
};

exports.updateSubscription = async (subscriptionId, data) => {
  const sub = await db.Subscriptions.findByPk(subscriptionId);
  if (!sub) {
    return null;
  }
  await sub.update({ ...data });
  return sub;
};

exports.deleteSubscriptionById = async (id) => {
  const sub = await db.Subscriptions.findByPk(id);
  if (!sub) {
    return null;
  }
  return sub.destroy();
};