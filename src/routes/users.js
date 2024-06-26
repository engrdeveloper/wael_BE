const router = require("express").Router();
const { getAll } = require("../controllers/users");

router.get("/", getAll);

module.exports = router;
