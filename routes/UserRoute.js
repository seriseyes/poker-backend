const router = require("express").Router();
const validateToken = require("../utils/Middleware");
const User = require("../models/User");
const log = require("../utils/Log");

router.route("/create").post(/*validateToken,*/ async (req, res) => {
    const body = req.body;
    const model = new User(body);

    const user = await User.findOne({username: body.username});
    if (user) return res.status(400).send("Нэвтрэх нэр давхацаж байна.");


    try {
        const result = await model.save();
        res.status(200).send(result);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.get("/check", validateToken, (req, res) => {
    log.info(req.user);
    res.status(200).send("success");
});

module.exports = router;