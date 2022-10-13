const router = require("express").Router();
const Room = require("../models/Room");
const User = require("../models/User");
const Table = require("../models/Table");
const validate = require("../utils/Middleware");
const log = require("../utils/Log");
const jwt = require("jsonwebtoken");

router.get("/create", validate, async (req, res) => {
    const table = await Table.findOne({_id: req.query.tableId}).lean();
    const user = await getUser(req.cookies.token);

    if (!table) {
        res.status(404).json({message: "Table not found"});
        return;
    }

    const cardsShuffled = [
        '2c', '2d', '2h', '2s',
        '3c', '3d', '3h', '3s',
        '4c', '4d', '4h', '4s',
        '5c', '5d', '5h', '5s',
        '6c', '6d', '6h', '6s',
        '7c', '7d', '7h', '7s',
        '8c', '8d', '8h', '8s',
        '9c', '9d', '9h', '9s',
        'Tc', 'Td', 'Th', 'Ts',
        'Jc', 'Jd', 'Jh', 'Js',
        'Qc', 'Qd', 'Qh', 'Qs',
        'Kc', 'Kd', 'Kh', 'Ks',
        'Ac', 'Ad', 'Ah', 'As'
    ];//52
    cardsShuffled.sort(() => 0.5 - Math.random());

    const model = new Room({
        table: table._id,
        cards: cardsShuffled,
        current: user._id,
        call: table.small
    });

    try {
        const result = await model.save();
        res.status(200).send(result._id);
    } catch (err) {
        res.status(400).send(err.message);
    }
});

router.get("/all/tableId", validate, async (req, res) => {
    try {
        let rooms = await Room.find({
            table: req.query.tableId,
            winner: {$exists: false}
        }, {cards: 0}).populate("table")
            .populate({
                path: "players.player",
                select: ["username"]
            }).exec();

        res.json(rooms);
    } catch (err) {
        log.error(err);
        res.status(400).send(err.message);
    }
});

router.get("/id", validate, async (req, res) => {
    const room = await Room.findOne({_id: req.query.id}).populate("table").populate("players.player").exec();

    const size = room.players.length * 2;

    if (room.started) {
        if (room.round === 1) {
            room.cards = [];
        } else if (room.round === 2) {
            room.cards = room.cards.slice(size, size + 3);
        } else if (room.round === 3) {
            room.cards = room.cards.slice(size, size + 4);
        } else if (room.round === 4) {
            room.cards = room.cards.slice(size, size + 5);
        } else room.cards = room.cards.slice(size, size + 5);
    } else room.cards = [];

    res.json(room);
});

router.get("/cards", validate, async (req, res) => {
    const user = await getUser(req.cookies.token);
    const room = await Room.findOne({_id: req.query.id}, {cards: 0}).populate("players.player").exec();
    if (!room) {
        return res.send("Aldaa");
    }
    if (room.winner) {
        return res.json(room.players.filter(el => el.player.username === req.user.name)[0].cards);
    } else if (room.started) {
        if (req.query.playerId !== user._id.toString()) {
            return res.json(["0", "0"]);
        }
    } else {
        return res.json([]);
    }

    room.cards = [];
    res.json(room.players.filter(el => el.player.username === req.user.name)[0].cards);
});

async function getUser(token) {
    const {name} = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return User.findOne({username: name}).lean();
}

module.exports = router;
