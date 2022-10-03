const mongoose = require("mongoose");
const moment = require('moment-timezone');

const schema = new mongoose.Schema({
    code: {type: String, required: true},
    players: [
        {
            type: {
                player: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
                cards: {type: [String]},
                bet: {type: Number, default: () => 0},
                status: {type: String, default: () => "active"},//fold == inactive
                big: {type: Boolean, default: () => false},
                small: {type: Boolean, default: () => false},
            }
        }],
    table: {type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true},
    started: {type: Boolean, default: () => false},
    status: {type: String, required: true, default: () => "active"},//active, inactive
    call: {type: Number, default: () => 0},
    pot: {type: Number, default: () => 0},
    cards: {type: [String]},
    current: {type: String, default: () => 0},//Яг одоо үйлдэл хийх хүн
    first: {type: String},
    round: {type: Number, default: () => 0},//Хэддэх тойрог вэ
    created: {type: Date, default: () => moment().tz("Asia/Ulaanbaatar"), immutable: true, required: true}
});

module.exports = mongoose.model("Room", schema);

