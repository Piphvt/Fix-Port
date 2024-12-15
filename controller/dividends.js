const { connection } = require('../database');

exports.getDividend = (req, res) => {
    connection.query('SELECT * FROM `dividends`', function (err, results, fields) {
        res.json(results);
    });
};

exports.addDividend = async (req, res) => {
    try {
        const { stock_no, dividend, employee_no, created_date, updated_date } = req.body;
        const dividendData = {
            stock_no,
            dividend,
            employee_no,
            created_date,
            updated_date,
        };

        connection.query('INSERT INTO `dividends` SET ?', [dividendData], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มเงินปันผล" });
            }
            res.json({ message: "เพิ่มเงินปันผลใหม่สำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updateDividend = async (req, res) => {
    try {
        const { stock_no, dividend, employee_no } = req.body;
        const no = req.params.no;

        connection.query(
            'UPDATE `dividends` SET `stock_no` = ?, `dividend` = ?, `employee_no` = ?, `updated_date` = now() WHERE no = ?',
            [stock_no, dividend, employee_no, no],
            function (err, updateResults) {
                if (err) {
                    console.error(err);
                    return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตเงินปันผล" });
                }
                res.json({ message: "อัปเดตเงินปันผลสำเร็จ", updateResults });
            }
        );
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.deleteDividend = (req, res) => {
    try {
        const DividendNo = req.params.no;
        connection.query('DELETE FROM `dividends` WHERE no = ?', [DividendNo], function (err, results) {
            res.json({ message: "ลบเงินปันผลสำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
