const mongoose = require("mongoose");
const moment = require('moment-timezone');

const schema = new mongoose.Schema({
    code: {type: String, required: true},
    players: [{type: mongoose.Schema.Types.ObjectId, ref: "User"}],
    table: {type: mongoose.Schema.Types.ObjectId, ref: "Table", required: true},
    started: {type: Boolean, default: () => false},
    status: {type: String, required: true, default: () => "active"},//active, inactive
    created: {type: Date, default: () => moment().tz("Asia/Ulaanbaatar"), immutable: true, required: true}
});

module.exports = mongoose.model("Room", schema);

