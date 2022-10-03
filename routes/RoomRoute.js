const router = require("express").Router();
const Room = require("../models/Room");
const User = require("../models/User");
const Table = require("../models/Table");
const validate = require("../utils/Middleware");
const log = require("../utils/Log");

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
        players: [{player: user, cards: []}],
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
    try {
        const rooms = await Room.find({
            status: "active",
            players: {$ne: []},
            table: req.query.tableId
        }).populate("table").populate("players", ["username"]).exec();
        res.json(rooms);
    } catch (err) {
        log.error(err);
        res.status(400).send(err.message);
    }
});

router.get("/id", validate, async (req, res) => {
    try {
        const room = await Room.findOne({_id: req.query.id}, {cards: 0}).populate("table").populate("players.player", ["username", "chips"]).exec();
        room.players.forEach(el => el.cards = undefined);
        res.json(room);
    } catch (err) {
        log.error(err);
        res.status(400).send(err.message);
    }
});

router.get("/calculated", validate, async (req, res) => {
    try {
        const room = await Room.findOne({_id: req.query.id}).populate("table").populate("players.player", ['username', 'chips', 'cards']).populate("players.cards").exec();
        if (!room.started) return res.json(room);

        const size = room.players.length * 2;

        if (room.round === 1) {
            room.cards = [];
        } else if (room.round === 2) {
            room.cards = room.cards.slice(size, size + 3);
        } else if (room.round === 3) {
            room.cards = room.cards.slice(size, size + 4);
        } else if (room.round === 3) {
            room.cards = room.cards.slice(size, size + 5);
        } else room.cards = room.cards.slice(size, size + 5);

        room.players.forEach(el => {
            if (el.player.username !== req.user.name) {
                el.cards = ["0", "0"];
            }
        });

        res.json(room);
    } catch (err) {
        log.error(err);
        res.status(400).send(err.message);

    }
});

router.get("/start", validate, async (req, res) => {
    const room = await Room.findOne({_id: req.query.id}).populate("table").populate("players.player").exec();
    if (room.players && room.players.length > 0 && room.players[0].player.username !== req.user.name) {
        return res.status(400).send("Зөвхөн өрөөг үүсгэсэн тоглогч эхлүүлэх боломжтой");
    }
    if (room.started) {
        return res.status(400).send("Тоглолт эхэлсэн байна.")
    }

    const cards = [
        '2c', '2d', '2h', '2s',
        '3c', '3d', '3h', '3s',
        '4c', '4d', '4h', '4s',
        '5c', '5d', '5h', '5s',
        '6c', '6d', '6h', '6s',
        '7c', '7d', '7h', '7s',
        '8c', '8d', '8h', '8s',
        '9c', '9d', '9h', '9s',
        '10c', '10d', '10h', '10s',
        'Jc', 'Jd', 'Jh', 'Js',
        'Qc', 'Qd', 'Qh', 'Qs',
        'Kc', 'Kd', 'Kh', 'Ks',
        'Ac', 'Ad', 'Ah', 'As'
    ];//52

    cards.sort(() => 0.5 - Math.random());

    room.cards = cards;
    room.started = true;

    let i = 0;

    room.players.forEach(el => {
        if (!el.cards) el.cards = [];
        el.cards.push(cards[i]);
        i++;
    });

    room.players.forEach(el => {
        el.cards.push(cards[i]);
        i++;
    });

    await room.save();

    res.send("success");
});

module.exports = router;
