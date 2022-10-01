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
        let room = await Room.findOne({_id: data.room}, {}).populate("table").populate("players.player").populate("players.cards").exec();
        const user = await User.findOne({username: data.user});

        if (!room) {
            io.to(room.room).emit("check_room", {message: "Өрөө олсонгүй"});
            return;
        }

        if (!user) {
            io.to(room.room).emit("check_room", {message: "Хэрэглэгч олсонгүй"});
            return;
        }

        if (!room.started && !room.players.some(el => el.player.username === user.username))
            room.players.push({player: user, cards: []});

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
        }

        await room.save();
        io.to(data.room).emit("check_room", {message: "success"});
    });
    socket.on("leave", async room => {
        const currentRoom = await Room.findOne({_id: room.room}, {}).populate("table").populate("players.player").exec();
        const cUser = await User.findOne({username: room.id});
        currentRoom.players = currentRoom.players.filter(f => f.player._id.toString() !== cUser._id.toString());
        await currentRoom.save();
        io.to(room.room).emit("check_room", {message: "success"});
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
