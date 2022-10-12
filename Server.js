//Import dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const log = require("./utils/Log");
const http = require('http');
const {Server} = require("socket.io");

//Import routes
const userRoute = require("./routes/UserRoute");
const authRoute = require("./routes/AuthRoute");
const cardRoute = require("./routes/CardRoute");
const tableRoute = require("./routes/TableRoute");
const roomRoute = require("./routes/RoomRoute");
const chipRoute = require("./routes/ChipRoute");
const {urlencoded} = require("express");
const Room = require("./models/Room");
const User = require("./models/User");
const Hand = require('pokersolver').Hand;

require("dotenv").config();

//Initializes
const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;//Backend PORT

//Socket
const io = new Server(server);

//Middlewares
app.use(cors({
    origin: "*",
    optionsSuccessStatus: 200,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended: true}))
app.use(express.static('build'))

mongoose.connect(
    process.env.MONGO_URL,
    {
        useNewUrlParser: true
    },
    (err) => {
        if (err) console.log(err)
        else log.error("Mongoose Connected Successfully");
    }
);

//Routes
app.use("/auth", authRoute);
app.use("/user", userRoute);
app.use("/card", cardRoute);
app.use("/table", tableRoute);
app.use("/room", roomRoute);
app.use("/chip", chipRoute);

app.get("/*", (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
});

io.on("connection", socket => {
    log.info("connected");
    socket.on("disconnect", () => log.info("disconnected"));
    socket.on("join_room", data => socket.join(data.room));

    socket.on("check_room", async data => {
        let room = await Room.findOne({_id: data.room}).populate("table").populate("players.player").exec();
        const user = await User.findOne({username: data.user});

        if (!room) {
            io.to(room.room).emit("check_room", {message: "Өрөө олсонгүй"});
            return;
        }

        if (!user) {
            io.to(room.room).emit("check_room", {message: "Хэрэглэгч олсонгүй"});
            return;
        }

        if (room.winner) return;

        if (!room.players.some(el => el.player.username === user.username)) {
            room.players.push({player: user, cards: [], state: room.started ? "spectating" : "playing"});
        }

        if (!room.started && data.started && room.players[0].player.username === user.username) {
            const cards = [
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
            cards.sort(() => 0.5 - Math.random());
            room.cards = cards;
            room.started = true;
            room.round = 1;

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

            if (!room.first) {
                const bigIndex = room.players.indexOf(room.players[Math.floor(Math.random() * room.players.length)]);

                let playerSmall = room.players[bigIndex + 1];
                if (!playerSmall) playerSmall = room.players[0];
                let playerCurrent = room.players[bigIndex + 2];
                if (!playerCurrent) playerCurrent = room.players[0];
                room.players[bigIndex].big = true;

                room.current = playerCurrent.player.username;
                room.first = room.current;
                room.players[room.players.indexOf(playerSmall)].small = true;
            }
            room.call = room.table.small;
            room.pot = room.call;
        }

        if (data.action && room.started) {
            const findNextIndex = (c) => {
                let index = room.players.filter(f => f.state === 'playing' && f.status === 'active').indexOf(c) + 1;

                for (let i = index; i < room.players.filter(f => f.state === 'playing' && f.status === 'active').length; i++) {
                    if (room.players[i].status === 'active') {
                        return i;
                    }
                }

                for (let i = 0; i < index; i++) {
                    if (room.players[i].status === 'active') {
                        return i;
                    }
                }
            }

            const current = room.players.find(f => f.player.username === user.username);

            switch (data.action) {
                case "fold":
                    room.current = room.players[findNextIndex(current)].player.username;
                    room.players.find(f => f.player.username === user.username).status = 'inactive';
                    break;
                case "call":
                    if (user.chips < room.call) return {message: "fail"};
                    room.pot += room.call;
                    room.players.find(f => f.player.username === user.username).bet += room.call;
                    room.current = room.players[findNextIndex(current)].player.username;
                    user.chips -= room.call;
                    await user.save();
                    break;
                case "raise":
                    const raise = parseInt(data.raise);
                    if (user.chips < raise) return {message: "fail"};
                    room.call = raise;
                    room.players.find(f => f.player.username === user.username).bet += raise;
                    room.current = room.players[findNextIndex(current)].player.username;
                    room.pot += raise;
                    user.chips -= raise;
                    await user.save();
                    break;
                case "check":
                    room.current = room.players[findNextIndex(current)].player.username;
                    break;
            }

            if (room.first === room.current) {
                room.round++;
            }

            if (data.action === 'fold') {
                if (room.first === user.username) {
                    room.first = room.current;
                }
            }
            if (room.round === 5) {
                const size = room.players.length * 2;
                const cards = room.cards.slice(size, size + 5);
                const winner = Hand.winners(room.players.map(el => {
                    const hand = Hand.solve([...cards, ...el.cards]);
                    hand.username = el.player.username;
                    return hand;
                }));
                room.winner = winner[0].username;
                user.chips = room.pot;
                await User.updateOne({username: room.winner}, {$inc: {chips: room.pot}});
            }
        }

        await room.save();
        io.to(data.room).emit("check_room", {message: "success"});
    });
    socket.on("leave", async data => {
        const room = await Room.findOne({_id: data.room}).populate("table").populate("players.player").exec();
        room.players.find(f => f.player.username === data.user).state = 'exit';
        await room.save();
        io.to(data.room).emit("check_room", {message: "success", show: "no"});
    });
    socket.on("send", data => {
        io.to(data.room).emit("send", {
            sender: data.user,
            message: data.message,
        });
    });
    socket.on("move", async data => {
        io.to(data.oldRoom).emit("move", {room: data.room});
    });
});

//Эхлэл
server.listen(PORT, () => {
    log.info(`
░█▀▀▀█ ░█▀▀▀ ░█▀▀█ ░█──░█ ░█▀▀▀ ░█▀▀█ 　 ░█▀▀▀█ ▀▀█▀▀ ─█▀▀█ ░█▀▀█ ▀▀█▀▀ ░█▀▀▀ ░█▀▀▄ 
─▀▀▀▄▄ ░█▀▀▀ ░█▄▄▀ ─░█░█─ ░█▀▀▀ ░█▄▄▀ 　 ─▀▀▀▄▄ ─░█── ░█▄▄█ ░█▄▄▀ ─░█── ░█▀▀▀ ░█─░█ 
░█▄▄▄█ ░█▄▄▄ ░█─░█ ──▀▄▀─ ░█▄▄▄ ░█─░█ 　 ░█▄▄▄█ ─░█── ░█─░█ ░█─░█ ─░█── ░█▄▄▄ ░█▄▄▀`);
    log.info("PORT: " + PORT);
});
