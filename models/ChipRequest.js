const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    user: {type: mongoose.Schema.Types.ObjectId, ref: "User", required: true},//Хүсэлт гаргасан
    accepted: {type: mongoose.Schema.Types.ObjectId, ref: "User"},//Хүсэлтийг баталгаажуулсан
    amount: {type: Number, default: () => 0},
    type: {type: String},//out, in
    status: {type: String, required: true, default: () => "active"},//active, inactive
    created: {type: Date, default: () => Date.now(), immutable: true, required: true}
});

module.exports = mongoose.model("ChipRequest", schema);

