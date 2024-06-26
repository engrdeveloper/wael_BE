const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
        email: {
            type: String,
            required: true
        },
        password: {
            type: String,
            required: true
        },
    },
    {
        timestamps: true
    }
);

const Users = mongoose.model('user', userSchema);

module.exports = Users;