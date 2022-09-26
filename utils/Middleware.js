const jwt = require("jsonwebtoken");
/**
 * Token шалгах middleware
 * @param req HTTP Request
 * @param res HTTP Response
 * @param next Дараагийн функц
 */
module.exports = (req, res, next) => {
    const token = req.cookies.token;
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, user) => {
        console.log(err);
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    })
}