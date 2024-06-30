const Jwt = require("jsonwebtoken");

exports.auth = async (req, res, next) => {

    const token = req.headers['authorization'];

    if (!!token) {

        let verifyToken = Jwt.verify(token, 'NODEAPI@123');

        if (verifyToken) {
            req.token = token;
            req.user = Jwt.decode(token)
        }

        next();

    } else {
        return res.status(401).json({success: false, error: {message: 'Unauthorized'}});
    }
};