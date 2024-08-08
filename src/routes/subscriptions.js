const express = require('express');
const {
  userSubscription,
  cancelSubscription,
  createSubscription,
  renewSubscription
} = require('../controllers/subscriptions');

const { auth } = require('../middlewares/auth');

const router = express.Router();

router.get('/user-subscription', auth, userSubscription);

router.post('/', auth, createSubscription);

router.post('/renew', auth, renewSubscription);

router.delete('/cancel-subscription', auth, cancelSubscription);

module.exports = router;