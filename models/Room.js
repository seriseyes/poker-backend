const mongoose = require("mongoose");
const moment = require('moment-timezone');

const schema = new mongoose.Schema({
    players: [
        {
            type: {
                player: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
                cards: {type: [String], default: () => []},
                big: {type: Boolean, default: () => false},
                small: {type: Boolean, default: () => false},
                status: {type: String},//playing, exit, fold
            },
        }, {default: () => []},],
    table: {type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true},
    call: {type: Number, default: () => 0},
    pot: {type: Number, default: () => 0},
    cards: {type: [String]},
    current: {type: String},//Яг одоо үйлдэл хийх хүн
    round: {type: Number, default: () => 0},//Хэддэх тойрог вэ
    first: {type: String},//Эхний тоглогч
    winner: {type: String},
    started: {type: Boolean, default: () => false},
    created: {type: Date, default: () => moment().tz("Asia/Ulaanbaatar"), immutable: true, required: true}
});

module.exports = mongoose.model("Room", schema);
