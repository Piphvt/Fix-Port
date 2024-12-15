const { connection } = require('../database');

exports.getTransaction = (req, res) => {
    connection.query('SELECT * FROM `transactions`',
        function (err, results, fields) {
            res.json(results);
        }
    );
}

exports.addTransaction = async (req, res) => {
    try {
        const { stock_detail_no, type, amount, price, commission_no, from_no, employee_no, created_date, updated_date } = req.body;

        const detailData = {
            stock_detail_no,
            type,
            amount,
            price,
            commission_no,
            from_no,
            employee_no,
            created_date,
            updated_date,
        }

        connection.query('INSERT INTO `transactions` SET ?', [detailData], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มธุรกรรม" });
            }
            res.json({ message: "เพิ่มธุรกรรมใหม่สำเร็จ", results });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.updateTransaction = async (req, res) => {
    try {
        const { stock_detail_no, type, amount, price, commission_no, from_no, employee_no } = req.body;
        const detailNo = req.params.no;

        connection.query('UPDATE `transactions` SET `stock_detail_no`= ?, `type`= ?, `amount`= ?, `price`= ?, `commission_no`= ?, `from_no`= ?, `employee_no`= ?, `updated_date`= NOW() WHERE no = ?',
            [stock_detail_no, type, amount, price, commission_no, from_no, employee_no, detailNo], function (err, results) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตธุรกรรม" });
                }
                res.json({ message: "อัปเดตธุรกรรมสำเร็จ", results });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteTransaction = (req, res) => {
    try {
        const detailNo = req.params.no;
        connection.query('DELETE FROM `transactions` WHERE no = ?',
            [detailNo], function (err, results) {
                res.json({ message: "ลบธุรกรรมสำเร็จ", results });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}
