const mongoose = require("mongoose");
const moment = require('moment-timezone');

const schema = new mongoose.Schema({
    code: {type: String, required: true},
    players: [
        {
            type: {
                player: {type: mongoose.Schema.Types.ObjectId, ref: "User"},
                cards: {type: [String]}
            }
        }],
    table: {type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true},
    started: {type: Boolean, default: () => false},
    status: {type: String, required: true, default: () => "active"},//active, inactive
    raise: {type: Number, default: () => 0},
    cards: {type: [String]},
    created: {type: Date, default: () => moment().tz("Asia/Ulaanbaatar"), immutable: true, required: true}
});

module.exports = mongoose.model("Room", schema);

