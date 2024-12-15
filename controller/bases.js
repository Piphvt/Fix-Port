const { connection } = require('../database');

exports.getBase = (req, res) => {
    connection.query('SELECT * FROM `bases`', function (err, results, fields) {
        res.json(results);
    });
};

exports.addBase = async (req, res) => {
    try {
        const { base, employee_no, created_date, updated_date } = req.body;
        connection.query('SELECT * FROM `bases` WHERE `base` = ?', [base], function (err, results) {
            if (results.length > 0) {
                return res.status(400).json({ message: "ฐานทุนนี้มีอยู่แล้ว" });
            } else {
                const baseData = {
                    base,
                    employee_no,
                    created_date,
                    updated_date,
                };
                connection.query('INSERT INTO `bases` SET ?', [baseData], function (err, results) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มฐานทุน" });
                    }
                    res.json({ message: "เพิ่มฐานทุนใหม่สำเร็จ", results });
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updateBase = async (req, res) => {
    try {
        const { base, employee_no } = req.body;
        const no = req.params.no;
        connection.query('SELECT * FROM `bases` WHERE `base` = ? AND no != ?', [base, no], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "ฐานทุนนี้มีอยู่แล้ว" });
            }
            connection.query(
                'UPDATE `bases` SET `base` = ?, `employee_no` = ?, `updated_date` = now() WHERE no = ?',
                [base, employee_no, no],
                function (err, updateResults) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
                    }
                    res.json({ message: "อัปเดตฐานทุนสำเร็จ", updateResults });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.deleteBase = (req, res) => {
    try {
        const BaseNo = req.params.no;
        connection.query('DELETE FROM `bases` WHERE no = ?', [BaseNo], function (err, results) {
            res.json({ message: "ลบฐานทุนสำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
