const { connection } = require('../database');

exports.getPrice = (req, res) => {
    connection.query('SELECT * FROM `prices`', function (err, results, fields) {
        res.json(results);
    });
};

exports.addPrice = async (req, res) => {
    try {
        const { stock_no, price, employee_no, created_date, updated_date } = req.body;
        const priceData = {
            stock_no,
            price,
            employee_no,
            created_date,
            updated_date,
        };

        connection.query('INSERT INTO `prices` SET ?', [priceData], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มราคาหุ้น" });
            }
            res.json({ message: "เพิ่มราคาหุ้นใหม่สำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updatePrice = async (req, res) => {
    try {
        const { stock_no, price, employee_no, created_date } = req.body;
        const no = req.params.no;

        connection.query(
            'UPDATE `prices` SET `stock_no` = ?, `price` = ?, `employee_no` = ?, `created_date` = ?, `updated_date` = now() WHERE no = ?',
            [stock_no, price, employee_no, created_date, no],
            function (err, updateResults) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตราคาหุ้น" });
                }
                res.json({ message: "อัปเดตราคาหุ้นสำเร็จ", updateResults });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.deletePrice = (req, res) => {
    try {
        const PriceNo = req.params.no;
        connection.query('DELETE FROM `prices` WHERE no = ?', [PriceNo], function (err, results) {
            res.json({ message: "ลบราคาหุ้นสำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
