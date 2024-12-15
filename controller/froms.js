const { connection } = require('../database');

exports.getFrom = (req, res) => {
    connection.query('SELECT * FROM `froms`',
        function (err, results, fields) {
            res.json(results);
        }
    );
}

exports.addFrom = async (req, res) => {
    try {
        const { from, employee_no, created_date, updated_date } = req.body;
        connection.query('SELECT * FROM `froms` WHERE `from` = ?',
            [from], function (err, results) {
                if (results.length > 0) {
                    return res.status(400).json({ message: "ที่มาที่ไปนี้มีอยู่แล้ว" });
                } else {
                    const fromData = {
                        from,
                        employee_no,
                        created_date,
                        updated_date,
                    }
                    connection.query('INSERT INTO `froms` SET ?',
                        [fromData], function (err, results) {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มที่มาที่ไป" });
                            }
                            res.json({ message: "เพิ่มข้อมูลที่มาที่ไปใหม่สำเร็จ", results });
                        }
                    );
                }
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.updateFrom = async (req, res) => {
    try {
        const { from, employee_no } = req.body;
        const no = req.params.no;
        connection.query('SELECT * FROM `froms` WHERE `from` = ? AND no != ?', [from, no], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "ที่มาที่ไปนี้มีอยู่แล้ว" });
            }
            connection.query('UPDATE `froms` SET `from` = ?, `employee_no` = ?, `updated_date` = now() WHERE no = ?',
                [from, employee_no, no], function (err, updateResults) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
                    }
                    res.json({ message: "อัปเดตข้อมูลที่มาที่ไปสำเร็จ", updateResults });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteFrom = (req, res) => {
    try {
        const FromNo = req.params.no;
        connection.query('DELETE FROM `froms` WHERE no = ?',
            [FromNo], function (err, results) {
                res.json({ message: "ลบข้อมูลที่มาที่ไปสำเร็จ", results });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}
