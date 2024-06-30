const db = require('../models');
const userService = require('../services/users');
const bcrypt = require('bcrypt');
const Jwt = require('jsonwebtoken');

exports.addUser = async (req, res) => {

    try {

        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(500).json({success: false, error: {message: 'All fields are required'}});
        }

        const user = await userService.addUser({email, password});

        res.status(200).json({success: true, message: 'User Created Successfully'});

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};

exports.getOneUser = async (req, res) => {

    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(500).json({success: false, error: {message: 'User ID is required'}});
        }

        const user = await userService.getOneUser(userId);

        if (!user) {
            return res.status(200).json({success: false, message: 'User Not Found'});
        }

        res.status(200).json(user);

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};

exports.updateUser = async (req, res) => {
    try {

        const userId = req.params.id;

        const {email, password} = req.body;

        if (!email && !password) {
            return res.status(500).json({success: false, error: {message: 'Provide data to update'}});
        }

        let updatedUser=null

        if(email){
             updatedUser = await userService.updateUser(userId, {email, password});

        }else{
             updatedUser = await userService.updateUser(userId, {email, password});

        }


        if (!updatedUser) {
            return res.status(200).json({success: false, message: 'User Not Found'});
        }

        res.status(200).json({success: true, data: {updatedUser}});

    } catch (error) {
        res.status(500).json({success: false, error: {message: 'Something went wrong', reason: error.message}})
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const userId = req.params.id;

        if (!userId) {
            return res.status(500).json({success: false, error: {message: 'User ID is required'}});
        }

        const deletedUser = await userService.deleteUserById(userId);

        if (!deletedUser) {
            return res.status(200).json({success: false, message: 'User Not Found'});
        }

        res.status(200).json({success: true, message: 'User Deleted Successfully'});

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};

exports.login = async (req, res) => {

    try {
        const {email, password} = req.body;

        if (!email || !password) {
            return res.status(500).json({success: false, error: {message: 'Email and password are required'}});
        }

        const user = await userService.getUserByEmail(email);

        if (!user) {
            return res.status(500).json({success: false, error: {message: 'Invalid Credentials'}});
        }

        const isPasswordValid = await bcrypt.compare(password, user.password)

        if (!isPasswordValid) {
            return res.status(401).json({success: false, error: {message: 'Invalid Credentials'}});
        }

        const token = Jwt.sign(
            {userId: user.id, email: user.email},
            'NODEAPI@123'
        );

        res.status(200).json({token, success: true, message: 'User Login Successfully', user});

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};


exports.getUsersByEmailPrefix = async (req, res) => {
    try {

        const emailPrefix = req.params.emailPrefix;

        if (!emailPrefix) {
            return res.status(500).json({error: 'Email prefix is required'});
        }

        const users = await userService.getUsersByEmailPrefix(emailPrefix);

        if (!users.length) {
            return res.status(404).json({error: 'No users found with the given email prefix'});
        }

        res.status(200).json({success: true, data: {users}});

    } catch (error) {
        res.status(500).json({
            success: false,
            error: {message: 'Something went wrong', reason: error.message}
        })
    }
};
