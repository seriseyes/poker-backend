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

router.get("/all", validateToken, async (req, res) => {
    const user = await User.findOne({username: req.user.name});
    if (!user || user.role !== "admin") {
        res.status(401).send("Хандах эрхгүй хэрэглэгч байна");
        return;
    }

    const users = await User.find({}, {password: 0, bank: 0, accountName: 0, account: 0});
    res.json(users);
});

router.get("/ban", validateToken, async (req, res) => {
    const user = await User.findOne({username: req.user.name});
    if (!user || user.role !== "admin") {
        res.status(401).send("Хандах эрхгүй хэрэглэгч байна");
        return;
    }

    const toBan = await User.findOne({_id: req.query.id});

    await User.updateOne({_id: req.query.id}, {ban: !toBan.ban});

    res.send("Амжилттай");
});

router.get("/me", validateToken, async (req, res) => {
    const user = await User.findOne({username: req.user.name});
    res.json(user);
});

module.exports = router;
