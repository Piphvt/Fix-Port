const { connection } = require('../database');

exports.getCustomer = (req, res) => {
    connection.query('SELECT * FROM `customers`', function (err, results, fields) {
        res.json(results);
    });
};

exports.addCustomer = async (req, res) => {
    try {
        const { id, nickname, type_no, base_no, employee_no, created_date, updated_date } = req.body;
        connection.query('SELECT * FROM `customers` WHERE `id` = ?', [id], function (err, results) {
            if (results.length > 0) {
                return res.status(400).json({ message: "ID นี้มีอยู่แล้ว" });
            } else {
                const customerData = {
                    id,
                    nickname,
                    type_no,
                    base_no,
                    employee_no,
                    created_date,
                    updated_date,
                };
                connection.query('INSERT INTO `customers` SET ?', [customerData], function (err, results) {
                    if (err) {
                        console.error(err);
                        return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มลูกค้า" });
                    }
                    res.json({ message: "เพิ่มลูกค้าใหม่สำเร็จ", results });
                });
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updateCustomer = async (req, res) => {
    try {
        const { id, nickname, type_no, base_no, employee_no } = req.body;
        const customerNo = req.params.no;
        connection.query('SELECT * FROM `customers` WHERE `id` = ? AND `no` != ?', [id, customerNo], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการตรวจสอบ ID ลูกค้าที่มีอยู่" });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: "ID นี้มีอยู่แล้วสำหรับลูกค้าคนอื่น" });
            } else {
                connection.query(
                    'UPDATE `customers` SET `id`= ?, `nickname`= ?, `type_no`= ?, `base_no`= ?, `employee_no`= ?, `updated_date`= NOW() WHERE no = ?',
                    [id, nickname, type_no, base_no, employee_no, customerNo],
                    function (err, results) {
                        if (err) {
                            console.error(err);
                            return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตลูกค้า" });
                        }
                        res.json({ message: "ลูกค้าได้รับการอัปเดต", results });
                    }
                );
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.deleteCustomer = (req, res) => {
    try {
        const customerNo = req.params.no;
        connection.query('DELETE FROM `customers` WHERE no = ?', [customerNo], function (err, results) {
            res.json({ message: "ลบลูกค้าสำเร็จ", results });
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "เกิดข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};
