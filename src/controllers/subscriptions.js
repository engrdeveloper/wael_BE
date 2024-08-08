const db = require('../models')
const Subscription = require('../services/subscriptions');
const userService = require('../services/users');
const { stripe: str } = require('../config');
const stripe = require('stripe')(str.secretKey);

const createSubscription = async (req, res, next) => {

  const { plan, email, paymentMethodId } = req.body

  let existingUser;

  try {

    if (!plan) {
      return res.status(500).json({ success: false, error: { message: 'Plan is required' } });
    }
    else {
      if (plan === 'premium' && (!email || !paymentMethodId)) {
        return res.status(500).json({ success: false, error: { message: 'Required Fields are missing' } });
      }
    }


    existingUser = await userService.getOneUser(req?.user?.userId);

    if (!existingUser) {
      return res.status(500).json({
        success: false,
        error: { message: 'User Not Found' }
      });
    }

    console.log(existingUser)

    if (plan === 'premium') {

      let checkSubscription = await Subscription.getOneSubscription(req?.user?.userId)

      console.log(checkSubscription, 'jjjjjj')

      if (checkSubscription && checkSubscription?.plan === 'premium') {
        return res.status(500).json({ success: false, error: { message: 'User already has subscription' } });
      }

      let customer = await stripe.customers.create({
        payment_method: paymentMethodId,
        email,
        invoice_settings: {
          default_payment_method: paymentMethodId,
        },
      });

      let subscription = await stripe.subscriptions.create({
        customer: customer?.id,
        items: [
          {
            price: str.price1,
          },
        ],
      });

      console.log(subscription, '$$$$$$$$$$$$$$')

      const { id, current_period_end, current_period_start, status } = subscription;

      console.log(id, current_period_end, current_period_start, status, 'iiiiiiiiiiiiiiiiiiiiiii')

      let newSubscription = null;

      if (!checkSubscription) {
        newSubscription = await Subscription.addSubscription(existingUser.id, 'premium', id, current_period_start * 1000,
          current_period_end * 1000, customer?.id)
      }
      else {
        newSubscription = Subscription.updateSubscription(checkSubscription?.id, {
          plan,
          subscriptionId: id,
          current_period_end: current_period_end * 1000,
          current_period_start: current_period_start * 1000,
          status: "active",
          customerId: customer?.id
        })

        newSubscription = {
          plan,
          subscriptionId: id,
          current_period_end: current_period_end * 1000,
          current_period_start: current_period_start * 1000,
          status: "active",
          customerId: customer?.id
        }
      }

      return res.json({
        message: 'Premium plan activated',
        data: { subscription: Array.isArray(newSubscription) ? newSubscription[0] : newSubscription }
      });

    }
    else {

      let checkSubscription = await Subscription.getOneSubscription(req?.user?.userId)

      console.log(checkSubscription, 'jjjjjj')

      if (checkSubscription) {
        return res.status(500).json({ success: false, error: { message: 'User already has subscription' } });
      }

      let newSubscription = await Subscription.addSubscription(existingUser.id, 'basic', null, null, null, null)

      return res.json({
        message: 'Free plan activated',
        data: { subscription: Array.isArray(newSubscription) ? newSubscription[0] : null }
      });
    }

  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error while creating subscription', reason: error.message }
    });

  }
};

const userSubscription = async (req, res, next) => {

  try {

    let checkSubscription = await Subscription.getOneSubscription(req?.user?.userId)

    if (!checkSubscription) {
      return res.status(500).json({ success: false, error: { message: 'User does not has active subscription' } });
    }

    return res.json({ success: true, userSubscriptions: checkSubscription });
  }

  catch (error) {

    console.log(error);

    return res.status(500).json({
      success: false,
      error: { message: 'Error while creating subscription', reason: error.message }
    });
  }

};

const renewSubscription = async (req, res, next) => {

  try {

    let existingSubscription = await Subscription.getOneSubscription(req?.user?.userId)

    if (!existingSubscription || existingSubscription?.plan === 'basic') {
      return res.status(500).json({
        success: false,
        error: { message: 'User does not has premium active subscription' }
      });
    }

    let subscription = await stripe.subscriptions.create({
      customer: existingSubscription?.customerId,
      items: [
        {
          price: str.price1,
        },
      ],
    });

    const { current_period_end, current_period_start, id } = subscription

    let update = await Subscription.updateSubscription(existingSubscription?.id, {
      subscriptionId: id,
      current_period_end: current_period_end * 1000,
      current_period_start: current_period_start * 1000
    })

    if (!update) {
      return res.status(500).json({
        success: false,
        error: { message: 'Error while updating subscription', reason: 'Cannot find subscription in DB' }
      });
    }

    const { userId, subscriptionId, customerId, createdAt, updatedAt, ...newObj } = update?.dataValues

    return res.status(200).json({
      success: true,
      data: { message: 'Subscription plan renewed', subscription: newObj }
    });

  }

  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error while updating subscription', reason: error.message }
    });
  }
};

const cancelSubscription = async (req, res, next) => {

  try {

    let existingSubscription = await Subscription.getOneSubscription(req?.user?.userId)

    if (!existingSubscription || existingSubscription?.plan === 'basic') {
      return res.status(500).json({ success: false, error: { message: 'User does not has active subscription' } });
    }

    let deleted = await stripe.subscriptions.cancel(existingSubscription?.subscriptionId);

    let deleteRecord = await Subscription.deleteSubscriptionById(existingSubscription?.id)

    res.json({ success: true, data: { message: 'Subscription cancelled successfully' } })

  }
  catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      error: { message: 'Error while cancelling subscription', reason: error.message }
    });
  }

};

module.exports = {
  renewSubscription,
  createSubscription,
  userSubscription,
  cancelSubscription
}
