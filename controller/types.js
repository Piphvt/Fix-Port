const { connection } = require('../database');

exports.getType = (req, res) => {
    connection.query('SELECT * FROM `types`',
        function (err, results, fields) {
            res.json(results);
        }
    );
}

exports.addType = async (req, res) => {
    try {
        const { type, employee_no, created_date, updated_date } = req.body;
        connection.query('SELECT * FROM `types` WHERE `type` = ?',
            [type], function (err, results) {
                if (results.length > 0) {
                    return res.status(400).json({ message: "ประเภทนี้มีอยู่แล้ว" });
                } else {
                    const typeData = {
                        type,
                        employee_no,
                        created_date,
                        updated_date,
                    }
                    connection.query('INSERT INTO `types` SET ?',
                        [typeData], function (err, results) {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มประเภท" });
                            }
                            res.json({ message: "เพิ่มประเภทใหม่สำเร็จ", results });
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

exports.updateType = async (req, res) => {
    try {
        const { type, employee_no } = req.body;
        const no = req.params.no;
        connection.query('SELECT * FROM `types` WHERE `type` = ? AND no != ?', [type, no], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "ประเภทนี้มีอยู่แล้ว" });
            }
            connection.query('UPDATE `types` SET `type` = ?, `employee_no` = ?, `updated_date` = now() WHERE no = ?',
                [type, employee_no, no], function (err, updateResults) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "ข้อผิดพลาดในการอัปเดตประเภท" });
                    }
                    res.json({ message: "อัปเดตประเภทสำเร็จ", updateResults });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteType = (req, res) => {
    try {
        const TypeNo = req.params.no;
        connection.query('DELETE FROM `types` WHERE no = ?',
            [TypeNo], function (err, results) {
                res.json({ message: "ลบประเภทสำเร็จ", results });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}
