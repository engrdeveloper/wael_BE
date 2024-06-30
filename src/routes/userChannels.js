const express = require('express');
const router = express.Router();
const userController = require('../controllers/userChannels');
const {auth} = require('../middlewares/auth')

router.post('/', auth, userController.addChannel);

router.get('/:id', auth, userController.getOneChannel);

router.put('/:id', auth, userController.updateChannel);

router.delete('/:id', auth, userController.deleteChannel);

module.exports = router;
