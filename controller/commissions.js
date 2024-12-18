const { connection } = require('../database');

exports.getCommission = (req, res) => {
    connection.query('SELECT * FROM `commissions`', function (err, results, fields) {
        res.json(results);
    });
};

exports.addCommission = async (req, res) => {
    try {
        const { commission, employee_no, created_date, updated_date } = req.body;
        connection.query('SELECT * FROM `commissions` WHERE ROUND(`commission`, 2) = ROUND(?, 2)', [commission], function (err, results) {
            if (results.length > 0) {
                return res.status(400).json({ message: "ค่าธรรมเนียมนี้มีอยู่แล้ว" });
            } else {
                const commissionData = {
                    commission,
                    employee_no,
                    created_date,
                    updated_date,
                };
                connection.query('INSERT INTO `commissions` SET ?', [commissionData], function (err, results) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มค่าธรรมเนียม" });
                    }
                    res.json({ message: "เพิ่มค่าธรรมเนียมใหม่สำเร็จ", results });
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updateCommission = async (req, res) => {
    try {
        const { commission, employee_no } = req.body;
        const no = req.params.no;
        connection.query('SELECT * FROM `commissions` WHERE `commission` = ? AND no != ?', [commission, no], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "ค่าธรรมเนียมนี้มีอยู่แล้ว" });
            }
            connection.query(
                'UPDATE `commissions` SET `commission` = ?, `employee_no` = ?, `updated_date` = now() WHERE no = ?',
                [commission, employee_no, no],
                function (err, updateResults) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
                    }
                    res.json({ message: "อัปเดตค่าธรรมเนียมสำเร็จ", updateResults });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.deleteCommission = (req, res) => {
    try {
        const CommissionNo = req.params.no;
        connection.query('DELETE FROM `commissions` WHERE no = ?', [CommissionNo], function (err, results) {
            res.json({ message: "ลบค่าธรรมเนียมสำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
