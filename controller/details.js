const { connection } = require('../database');

exports.getDetail = (req, res) => {
    connection.query('SELECT * FROM `details`', function (err, results, fields) {
        res.json(results);
    });
};

exports.addDetail = async (req, res) => {
    try {
        const { customer_no, stock_no, price, amount, from_no, comment, employee_no, created_date, updated_date } = req.body;

        const detailData = {
            customer_no,
            stock_no,
            price,
            amount,
            from_no,
            comment,
            employee_no,
            created_date,
            updated_date,
        };

        connection.query('INSERT INTO `details` SET ?', [detailData], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มรายละเอียด" });
            }
            res.json({ message: "เพิ่มรายละเอียดใหม่สำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updateDetail = async (req, res) => {
    try {
        const { customer_no, stock_no, price, amount, from_no, comment, employee_no, created_date} = req.body;
        const detailNo = req.params.no;
        const updatedData = {
            customer_no,
            stock_no,
            price,
            amount,
            from_no,
            comment,
            employee_no,
            created_date,
        };

        connection.query("UPDATE `details` SET ? WHERE `no` = ?", [updatedData, detailNo], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตรายละเอียด" });
            }
            res.json({ message: "อัปเดตรายละเอียดสำเร็จ", results });
        });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteDetail = (req, res) => {
    try {
        const detailNo = req.params.no;
        connection.query('DELETE FROM `details` WHERE no = ?', [detailNo], function (err, results) {
            res.json({ message: "ลบรายละเอียดสำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
