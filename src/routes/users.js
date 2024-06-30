const express = require('express');
const router = express.Router();
const userController = require('../controllers/users');
const {auth} = require('../middlewares/auth')

router.post('/', userController.addUser);

router.get('/:id', auth, userController.getOneUser);

router.put('/:id', auth, userController.updateUser);

router.delete('/:id', auth, userController.deleteUser);

router.post('/login', userController.login);

router.get('/email/:emailPrefix', auth, userController.getUsersByEmailPrefix);

module.exports = router;
