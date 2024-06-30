const db = require('../models');
const {Op} = require('sequelize');
const bcrypt = require('bcrypt');

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

