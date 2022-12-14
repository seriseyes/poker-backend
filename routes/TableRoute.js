const router = require("express").Router();
const Table = require("../models/Table");
const validate = require("../utils/Middleware");

router.get("/all/active", validate, async (req, res) => {
    const tables = await Table.find({status: "active"});
    res.json(tables);
});

router.post("/create", validate, async (req, res) => {
    const body = req.body;
    const model = new Table(body);

    if (!model.type || !model.big || !model.small) {
        res.status(400).send("Шаардлагатай талбаруудыг бөглөнө үү.");
        return;
    }

    try {
        await model.save();
        res.status(200).send("Амжилттай үүслээ.");
    } catch (err) {
        res.status(400).send(err.message);
    }
});

module.exports = router;
