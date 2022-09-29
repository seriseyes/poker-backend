const router = require("express").Router();
const Room = require("../models/Room");
const User = require("../models/User");
const Table = require("../models/Table");
const validate = require("../utils/Middleware");

router.get("/create", validate, async (req, res) => {
    const user = await User.findOne({username: req.user.name});

    const table = await Table.findOne({_id: req.query.tableId});

    if (!table) {
        res.status(404).json({message: "Table not found"});
        return;
    }

    const makeCode = (length) => {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
        const charactersLength = characters.length;
        for (let i = 0; i < length; i++) {
            result += characters.charAt(Math.floor(Math.random() *
                charactersLength));
        }
        return result.toUpperCase();
    }

    const model = new Room({
        code: makeCode(6),
        players: [user._id],
        table: table._id
    });

    try {
        const result = await model.save();
        res.status(200).send(result._id);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.get("/all/tableId", validate, async (req, res) => {
    const rooms = await Room.find({status: "active", players: {$ne: []} , table: req.query.tableId}).populate("table").populate("players", ["username"]).exec();
    res.json(rooms);
});

router.get("/id", validate, async (req, res) => {
    const room = await Room.findOne({_id: req.query.id}).populate("table").populate("players", ["username", "chips"]).exec();
    res.json(room);
});

module.exports = router;
