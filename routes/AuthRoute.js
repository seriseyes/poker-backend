const router = require("express").Router();
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const bcrypt = require('bcrypt');

/**
 * Авсан token-г client-н cookie-д хадгалах.
 */
router.route("/login").post(async (req, res) => {
    const user = {name: req.body.username}

    const model = await User.findOne({username: user.name});

    if (!model) return res.status(401).send("Нэвтрэх нэр эсвэл нууц үг буруу байна.");

    const match = await bcrypt.compare(req.body.password, model.password);

    if (!match) return res.status(401).send("Нэвтрэх нэр эсвэл нууц үг буруу байна.");

    if (model.ban) return res.status(400).send("Таны бүртгэлийг хориглосон байна [Banned].");

    const accessToken = generateAccessToken(user);
    res.cookie("token", accessToken);
    res.cookie("username", model.username);
    res.cookie("role", model.role);
    res.json({token: accessToken});
});

function generateAccessToken(user) {
    return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1d'})
}

module.exports = router;
