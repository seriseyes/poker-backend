//Import dependencies
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const path = require("path");
const log = require("./utils/Log");

//Import routes
const userRoute = require("./routes/UserRoute");
const authRoute = require("./routes/AuthRoute");
const {urlencoded} = require("express");

require("dotenv").config();

//Initializes
const app = express();
const PORT = process.env.PORT || 3000;//Backend PORT

//Middlewares
app.use(cors({
    origin: "*",
    optionsSuccessStatus: 200,
    credentials: true
}));
app.use(express.json());
app.use(cookieParser());
app.use(urlencoded({extended: true}))
//app.use(express.static(path.join(__dirname, "../medsoft-online-frontend/build/")));

mongoose.connect(
    process.env.MONGO_URL,
    {
        useNewUrlParser: true
    },
    (err) => {
        if(err) console.log(err)
        else log.error("Mongoose Connected Successfully");
    }
);

//Routes
app.use("/auth", authRoute);
app.use("/user", userRoute);

app.get("/*", (req, res) => {
    //res.sendFile(path.join(__dirname, "../medsoft-online-frontend/build/index.html"));
    res.send("it works");
});

//Эхлэл
app.listen(PORT, () => {
    log.info(`
░█▀▀▀█ ░█▀▀▀ ░█▀▀█ ░█──░█ ░█▀▀▀ ░█▀▀█ 　 ░█▀▀▀█ ▀▀█▀▀ ─█▀▀█ ░█▀▀█ ▀▀█▀▀ ░█▀▀▀ ░█▀▀▄ 
─▀▀▀▄▄ ░█▀▀▀ ░█▄▄▀ ─░█░█─ ░█▀▀▀ ░█▄▄▀ 　 ─▀▀▀▄▄ ─░█── ░█▄▄█ ░█▄▄▀ ─░█── ░█▀▀▀ ░█─░█ 
░█▄▄▄█ ░█▄▄▄ ░█─░█ ──▀▄▀─ ░█▄▄▄ ░█─░█ 　 ░█▄▄▄█ ─░█── ░█─░█ ░█─░█ ─░█── ░█▄▄▄ ░█▄▄▀`);
    log.info("PORT: " + PORT);
});