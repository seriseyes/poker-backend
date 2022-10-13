const router = require("express").Router();
const validateToken = require("../utils/Middleware");
const ChipRequest = require("../models/ChipRequest");
const User = require("../models/User");
const log = require("../utils/Log");

router.get("/create", validateToken, async (req, res) => {
    const user = await User.findOne({username: req.user.name});
    if (req.query.type === 'out') {
        if (parseInt(req.query.amount) < 10000) {
            return res.status(400).send("Хамгийн багадаа 10000₮ зарлага гаргах боломжтой");
        }
        if (user.chips < parseInt(req.query.amount)) {
            return res.status(400).send("Үлдэгдэл хүрэлцэхгүй байна");
        }
    } else if (req.query.type === 'in') {
        if (parseInt(req.query.amount) < 5000) {
            return res.status(400).send("Хамгийн багадаа 5000₮ цэнэглэлт хийх боломжтой")
        }
    } else res.status(400).send("Nice try")

    const model = new ChipRequest({
        user,
        amount: req.query.amount,
        type: req.query.type
    });

    try {
        await model.save();
        if (req.query.type === 'out') {
            user.chips -= req.query.amount;
            await user.save();
        }
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

    if (model.type === "in") {
        user.chips += model.amount;
        await user.save();
    }

    model.accepted = currentUser;
    model.status = "inactive";
    await model.save();

    res.send("Амжилттай баталгаажлаа");
});

module.exports = router;
