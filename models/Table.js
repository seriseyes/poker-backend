const mongoose = require("mongoose");

const schema = new mongoose.Schema({
    type: {type: String, required: true},//Texas, Omaha
    big: {type: Number, required: true},
    small: {type: Number, required: true},
    status: {type: String, required: true, default: () => "active"},//active, inactive
    created: {type: Date, default: () => Date.now(), immutable: true, required: true}
});

module.exports = mongoose.model("Table", schema);
