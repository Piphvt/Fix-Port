const { connection } = require('../database');

exports.getSet = (req, res) => {
    connection.query('SELECT * FROM `sets`',
        function (err, results, fields) {
            res.json(results);
        }
    );
}

exports.addSet = async (req, res) => {
    try {
        const { set, employee_no, created_date, updated_date } = req.body;
        connection.query('SELECT * FROM `sets` WHERE `set` = ?',
            [set], function (err, results) {
                if (results.length > 0) {
                    return res.status(400).json({ message: "ประเภทหุ้นนี้มีอยู่แล้ว" });
                } else {
                    const setData = {
                        set,
                        employee_no,
                        created_date,
                        updated_date,
                    }
                    connection.query('INSERT INTO `sets` SET ?',
                        [setData], function (err, results) {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มประเภทหุ้น" });
                            }
                            res.json({ message: "เพิ่มประเภทหุ้นใหม่สำเร็จ", results });
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

exports.updateSet = async (req, res) => {
    try {
        const { set, employee_no } = req.body;
        const no = req.params.no;
        connection.query('SELECT * FROM `sets` WHERE `set` = ? AND no != ?', [set, no], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "ประเภทหุ้นนี้มีอยู่แล้ว" });
            }
            connection.query('UPDATE `sets` SET `set` = ?, `employee_no` = ?, `updated_date` = now() WHERE no = ?',
                [set, employee_no, no], function (err, updateResults) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
                    }
                    res.json({ message: "อัปเดตประเภทหุ้นสำเร็จ", updateResults });
                }
            );
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteSet = (req, res) => {
    try {
        const SetNo = req.params.no;
        connection.query('DELETE FROM `sets` WHERE no = ?',
            [SetNo], function (err, results) {
                res.json({ message: "ลบประเภทหุ้นสำเร็จ", results });
            }
        );

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}
