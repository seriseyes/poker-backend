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
const jwt = require("jsonwebtoken");
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
    socket.on("join", async data => {
        await socket.join(data.room);

        const user = await getUser(data.token);
        const room = await Room.findOne({_id: data.room});

        const player = {
            player: user,
            status: room.started ? 'fold' : 'playing',
        };

        if (room.players.length === 0 || !room.players.some(p => p.player._id.toString() === player.player._id.toString())) {
            room.players.push(player);
        }

        await room.save();

        io.to(data.room).emit("update", {
            started: !room.started && room.players.length > 1
        });
    });
    socket.on("start", async (data) => {
        const room = await Room.findOne({_id: data.room}).populate("table").populate("players.player").exec();

        room.started = true;
        room.round = 1;

        let i = 0;
        room.players.forEach(el => {
            el.cards.push(room.cards[i]);
            i++;
        });
        room.players.forEach(el => {
            el.cards.push(room.cards[i]);
            i++;
        });

        if (data.round === "1") {
            room.players[0].big = true;
            room.first = room.players[0].player._id;
            room.players[1].small = true;
        } else {
            const item = room.players[Math.floor(Math.random() * room.players.length)];
            const bigIndex = room.players.indexOf(item);
            if (!bigIndex) {
                room.players[0].big = true;
                room.first = room.players[0].player._id;
                room.players[1].small = true;
            } else {
                room.players[bigIndex].big = true;
                room.first = room.players[bigIndex].player._id;
                try {
                    room.players[bigIndex + 1].small = true;
                } catch (e) {
                    room.players[0].big = true;
                    room.first = room.players[0].player._id;
                    room.players[1].small = true;
                }
            }
        }

        room.pot = room.call;

        await room.save();

        io.to(data.room).emit("update", {
            started: false
        });
    });
    socket.on("action", async data => {
        const user = await getUser(data.token);
        const room = await Room.findOne({_id: data.room}).populate("players.player").exec();

        const currentPlayer = room.players.find(player => player.player._id.toString() === user._id.toString());
        const activePlayers = room.players.filter(f => f.status === 'playing');

        switch (data.action) {
            case "call":
                if (user.chips < room.call) return {message: "fail"};
                room.pot += room.call;
                user.chips -= room.call;
                await user.save();
                break;
            case "raise":
                const raise = parseInt(data.raise);
                if (user.chips < raise) return {message: "fail"};
                room.call = raise;
                room.pot += raise;
                user.chips -= raise;
                await user.save();
                break;
            case "fold":
                room.players.find(player => player.player._id.toString() === user._id.toString()).status = "fold";
                break;
        }

        try {
            room.current = activePlayers[(activePlayers.indexOf(currentPlayer) + 1) % activePlayers.length].player._id;
        } catch (e) {
            return;
        }

        if (room.first === room.current) {
            room.round++;
        }

        const size = room.players.length * 2;

        if (room.round === 5) {
            const cards = room.cards.slice(size, size + 5);
            const winner = Hand.winners(room.players.map(el => {
                const hand = Hand.solve([...cards, ...el.cards]);
                hand.username = el.player.username;
                return hand;
            }));
            room.winner = winner[0].username;
            user.chips = room.pot;
            await User.updateOne({username: room.winner}, {$inc: {chips: room.pot}});
            await room.save();

            io.to(data.room).emit("won", {
                winner: winner[0].username,
            });
        } else await room.save();

        io.to(data.room).emit("update", {
            started: false
        });
    });
    socket.on("move", async data => {
        log.info("Moving");
        io.to(data.room).emit("move", {room: data.newRoom});
    });
    socket.on("leave", async (data) => {
        const user = await getUser(data.token);
        const room = await Room.findOne({_id: data.room}).populate("players.player").exec();
        room.players.forEach(el => {
            if (el.player._id.toString() === user._id.toString()) {
                el.status = 'exit';
            }
        });
        if (room.players.every(el => el.status === 'exit')) {
            if (!room.winner) {
                room.winner = "No one";
            }
        }
        await room.save();
        io.to(data.room).emit("update", {
            started: false
        });
    });
    socket.on("send", data => {
        io.to(data.room).emit("send", {
            message: data.message,
            sender: data.user
        })
    });
});

async function getUser(token) {
    const {name} = await jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    return User.findOne({username: name});
}

//Эхлэл
server.listen(PORT, () => {
    log.info(`
░█▀▀▀█ ░█▀▀▀ ░█▀▀█ ░█──░█ ░█▀▀▀ ░█▀▀█ 　 ░█▀▀▀█ ▀▀█▀▀ ─█▀▀█ ░█▀▀█ ▀▀█▀▀ ░█▀▀▀ ░█▀▀▄
─▀▀▀▄▄ ░█▀▀▀ ░█▄▄▀ ─░█░█─ ░█▀▀▀ ░█▄▄▀ 　 ─▀▀▀▄▄ ─░█── ░█▄▄█ ░█▄▄▀ ─░█── ░█▀▀▀ ░█─░█
░█▄▄▄█ ░█▄▄▄ ░█─░█ ──▀▄▀─ ░█▄▄▄ ░█─░█ 　 ░█▄▄▄█ ─░█── ░█─░█ ░█─░█ ─░█── ░█▄▄▄ ░█▄▄▀`);
    log.info("PORT: " + PORT);
});
