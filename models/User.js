const mongoose = require("mongoose");
const bcrypt = require('bcrypt');

const schema = new mongoose.Schema({
    username: {type: String, required: true, minLength: 3, maxLength: 20},
    password: {type: String, required: true},
    phone: {type: String, required: true},
    bank: {type: String, required: true},
    accountName: {type: String, required: true, maxLength: 50},
    account: {type: String, required: true},
    chips: {type: Number, default: 0},
    role: {type: String, required: true, default: () => "user"},//admin, user
    ban: {type: Boolean, default: () => false},
    created: {type: Date, default: () => Date.now(), immutable: true, required: true}//Илгээсэн огноо
});

schema.pre("save", async function (next) {
    try {
        if (!this.isModified('password')) return next();

        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (err) {
        next(err);
    }
});

module.exports = mongoose.model("User", schema);
