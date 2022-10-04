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
        let rooms = await Room.find({
            status: "active",
            players: {$ne: []},
            table: req.query.tableId,
            winner: {$exists: false}
        }, {cards: 0}).populate("table")
            .populate({
                path: "players.player",
                select: ["username"]
            }).exec();

        rooms = rooms.filter(f => {
            return !f.players.some(player => player.state === 'exit');
        })

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

        if (!room.winner) {
            room.players.forEach(el => {
                if (el.player.username !== req.user.name) {
                    el.cards = ["0", "0"];
                }
            });
        }

        res.json(room);
    } catch (err) {
        log.error(err);
        res.status(400).send(err.message);

    }
});

router.get("/move", validate, async (req, res) => {
    const room = await Room.findOne({_id: req.query.roomId}, {}).populate("table").populate("players.player").exec();

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

    const bigPlayer = room.players.find(f => f.big);
    const smallPlayer = room.players.find(f => f.small);

    let nextBigPlayer = room.players[room.players.indexOf(bigPlayer) + 1];
    let nextSmallPlayer = room.players[room.players.indexOf(smallPlayer) + 1];

    if (!nextBigPlayer) nextBigPlayer = room.players[0];
    if (!nextSmallPlayer) nextSmallPlayer = room.players[0];

    const players = [];

    room.players.filter(f => f.state !== 'exit').forEach(el => {
        el.cards = [];
        el.bet = 0;
        el.status = 'active';
        el.big = false;
        el.small = false;
        el.state = 'playing';
        players.push(el);
    });

    room.players[room.players.indexOf(nextBigPlayer)].big = true;
    room.players[room.players.indexOf(nextSmallPlayer)].small = true;

    const model = new Room({
        code: makeCode(6),
        players,
        table: room.table._id,
        current: room.players[0].player.username,
        first: room.players[0].player.username,
    });

    const newRoom = await model.save();

    res.send(newRoom._id);
});

module.exports = router;
