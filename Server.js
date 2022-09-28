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

app.get("/*", (req, res) => {
    res.sendFile(path.resolve(__dirname, 'build', 'index.html'))
});

io.on("connection", socket => {
    log.info("connected");
    socket.on("disconnect", () => log.info("disconnected"));
    socket.on("create", room => socket.join(room.id));
    socket.on("join", async room => {
        const currentRoom = await Room.findOne({_id: room.room}, {}).populate("table").populate("players").exec();
        console.log(currentRoom)
        jwt.verify(room.id, process.env.ACCESS_TOKEN_SECRET, async (err, user) => {
            const cUser = await User.findOne({username: user.name});
            if (currentRoom.players.filter(f => f._id === ""))
            currentRoom.players.push(cUser);

            console.log(currentRoom)
        });

        io.to(room.id).emit("join", room);
    });
    socket.on("leaved", room => io.to(room.id).emit("leaved", room));
});

//Эхлэл
server.listen(PORT, () => {
    log.info(`
░█▀▀▀█ ░█▀▀▀ ░█▀▀█ ░█──░█ ░█▀▀▀ ░█▀▀█ 　 ░█▀▀▀█ ▀▀█▀▀ ─█▀▀█ ░█▀▀█ ▀▀█▀▀ ░█▀▀▀ ░█▀▀▄ 
─▀▀▀▄▄ ░█▀▀▀ ░█▄▄▀ ─░█░█─ ░█▀▀▀ ░█▄▄▀ 　 ─▀▀▀▄▄ ─░█── ░█▄▄█ ░█▄▄▀ ─░█── ░█▀▀▀ ░█─░█ 
░█▄▄▄█ ░█▄▄▄ ░█─░█ ──▀▄▀─ ░█▄▄▄ ░█─░█ 　 ░█▄▄▄█ ─░█── ░█─░█ ░█─░█ ─░█── ░█▄▄▄ ░█▄▄▀`);
    log.info("PORT: " + PORT);
});
