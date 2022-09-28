const router = require("express").Router();

router.get("/shuffle", (req, res) => {
    const cards = [
        '2c', '2d', '2h', '2s',
        '3c', '3d', '3h', '3s',
        '4c', '4d', '4h', '4s',
        '5c', '5d', '5h', '5s',
        '6c', '6d', '6h', '6s',
        '7c', '7d', '7h', '7s',
        '8c', '8d', '8h', '8s',
        '9c', '9d', '9h', '9s',
        '10c', '10d', '10h', '10s',
        'Jc', 'Jd', 'Jh', 'Js',
        'Qc', 'Qd', 'Qh', 'Qs',
        'Kc', 'Kd', 'Kh', 'Ks',
        'Ac', 'Ad', 'Ah', 'As'
    ];//52

    cards.sort(() => 0.5 - Math.random());

    res.json(cards);
});

module.exports = router;
