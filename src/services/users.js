const db = require('../models');
const {Op} = require('sequelize');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const Jwt = require("jsonwebtoken");
const {emailService, hostname} = require('../config/index')

async function sendPasswordResetEmail(user, token) {
    const transporter = await nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: emailService.user,
            pass: emailService.password,
        },
    });
    const resetLink = `${hostname}/password-reset/${user.id}/${token}`;

    const mailOptions = {
        from: emailService.from,
        to: user.email,
        subject: 'Password Reset Request',
        text: `Click on the following link to reset your password: ${resetLink}`,
    };

    return transporter.sendMail(mailOptions).then(r => {
        console.log('Email sent:', r)
        return true
    }).catch(err => {
        console.log('Email failed:', err.message)
        return false
    })
}

exports.addUser = async ({email, password}) => {
    const hashedPassword = await bcrypt.hash(password, 10);
    return db.User.create({email, password: hashedPassword});
};

exports.getUserByEmail = async (email) => {
    return await db.User.findOne({where: {email: email}});
};

exports.getOneUser = async (userId) => {
    return db.User.findByPk(userId);
};

exports.updateUser = async (userId, {email, password}) => {
    const user = await db.User.findByPk(userId);
    if (!user) {
        return null;
    }

    if (email) {
        await user.update({email});
    }
    if (password) {

        const hashedPassword = await bcrypt.hash(password, 10);

        await user.update({password: hashedPassword});
    }

    return user;
};

exports.deleteUserById = async (userId) => {
    const user = await db.User.findByPk(userId);
    if (!user) {
        return null;
    }
    return user.destroy();
};

exports.login = async (email, password) => {
    return db.User.findOne({where: {email: email, password: password}});
}

exports.getUsersByEmailPrefix = async (emailPrefix) => {
    return db.User.findAll({
        where: {
            email: {
                [Op.like]: `${emailPrefix}%`
            }
        }
    });
};

exports.forgetPass = async (email) => {

    const user = await db.User.findOne({where: {email: email}});
    if (!user) return null;

    // Send password reset email
    const signedToken = Jwt.sign(
        {userId: user.id, email: user.email},
        'NODEAPI@123'
    );

    return sendPasswordResetEmail(user, signedToken);

}

