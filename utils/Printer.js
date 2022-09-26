const printer = (err, res) => {
    if (!err.response) {
        res.status(400).send("Холболт салсан байна. Түр хүлээгээд дахин оролдоно уу.");
        return "MAIN SERVICE STOPPED";
    } else if (err.response.status === 401) {
        res.status(401).send("Хүчингүй хандалт. Дахин нэвтэрнэ үү.");
    } else if (err.response.status === 400) {
        if (err.response.data?.message) {
            res.status(400).send("Алдаа: " + err.response.data.message);
        } else res.status(400).send("Алдаа: " + err.response.data);
    } else if (err.response.status === 404) {
        res.status(400).send("Тодорхойгүй алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.");
        return err.message;
    } else {
        res.status(400).send("Тодорхойгүй алдаа гарлаа. Түр хүлээгээд дахин оролдоно уу.");
        return err.message;
    }
    return null;
}

module.exports = printer;