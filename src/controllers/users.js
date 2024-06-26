const {getAllData} = require("../services/users");
const {success, error} = require("../utils/apiResponse");

exports.getAll = async (req, res) => {
    try {
        const data = await getAllData();
        success([], 200)(req, res);
    } catch (e) {
        error(e, "Something went wrong", 500)(req, res);
    }
};
