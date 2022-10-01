const router = require("express").Router();
const validateToken = require("../utils/Middleware");
const ChipRequest = require("../models/ChipRequest");
const User = require("../models/User");
const log = require("../utils/Log");

router.get("/create", validateToken, async (req, res) => {
    const user = await User.findOne({username: req.user.name});

    const model = new ChipRequest({
        user,
        amount: req.query.amount,
    });

    try {
        await model.save();
        res.status(200).send("Хүсэлт амжилттай илгээгдлээ");
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.get("/all/status", validateToken, async (req, res) => {
    const user = await User.findOne({username: req.user.name});
    if (!user || user.role !== "admin") {
        res.status(401).send("Хандах эрхгүй хэрэглэгч байна");
        return;
    }

    const requests = await ChipRequest.find({status: req.query.status}).populate("user").exec();
    res.json(requests);
});

router.get("/confirm", validateToken, async (req, res) => {
    const currentUser = await User.findOne({username: req.user.name});
    if (!currentUser || currentUser.role !== "admin") {
        res.status(401).send("Хандах эрхгүй хэрэглэгч байна");
        return;
    }

    const model = await ChipRequest.findOne({_id: req.query.id}).populate("user").exec();
    const user = await User.findOne({_id: model.user._id});
    user.chips += model.amount;

    model.accepted = currentUser;
    model.status = "inactive";
    await model.save();
    await user.save();

    res.send("Амжилттай баталгаажлаа");
});

module.exports = router;
