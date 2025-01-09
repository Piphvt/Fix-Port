const bcrypt = require("bcrypt");
const { connection } = require("../database");

// ดึงข้อมูลพนักงานทั้งหมด
exports.getEmployee = (req, res) => {
    connection.query('SELECT * FROM `employees`', function (err, results) {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงาน:', err);
            return res.status(500).json({ message: 'ข้อผิดพลาดในการดึงข้อมูลพนักงาน' });
        }
        res.json(results);
    });
}

// อัปเดตพนักงาน รหัสผ่าน
exports.updateEmployeePassword = async (req, res) => {
    try {
        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('UPDATE `employees` SET `password`= ?, `updated_date`= now() WHERE no = ?',
            [hashedPassword, req.params.no], function (err, results) {
                if (err) {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตรหัสผ่านพนักงาน:', err);
                    return res.status(500).json({ message: 'ข้อผิดพลาดในการอัปเดตรหัสผ่านพนักงาน' });
                }
                res.json(results);
            }
        );
        console.log("อัปเดตรหัสผ่านพนักงานสำเร็จ");
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตรหัสผ่านพนักงาน', error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

// อัปเดตข้อมูลพนักงาน
exports.updateEmployee = async (req, res) => {
    try {
        const { fname, lname, phone, gender } = req.body;
        connection.query('UPDATE `employees` SET `fname`= ?, `lname`= ?, `phone`= ?, `gender`= ?, `updated_date`= now() WHERE no = ?',
            [fname, lname, phone, gender, req.params.no], function (err, results) {
                if (err) {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตพนักงาน:', err);
                    return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตพนักงาน' });
                }
                res.json(results);
            }
        );
        console.log('อัปเดตข้อมูลพนักงานสำเร็จ');
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตพนักงาน', error);
        return res.status(500).json({ message: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
}

// อัปเดตข้อมูลพนักงานทั้งหมด
exports.updateEmployeeAll = async (req, res) => {
    try {
        const { email, fname, lname, rank_no, phone, gender, status } = req.body;
        connection.query('SELECT * FROM `employees` WHERE `email` = ? AND `no` != ?', [email, req.params.no], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการตรวจสอบอีเมล:', err);
                return res.status(500).json({ message: 'ข้อผิดพลาดในการตรวจสอบอีเมล' });
            }
            if (results.length > 0) {
                return res.status(400).json({ message: 'อีเมลนี้มีผู้ใช้งานแล้ว' });
            }
            connection.query('UPDATE `employees` SET `email` = ?, `fname` = ?, `lname` = ?, `rank_no` = ?, `phone` = ?, `gender` = ?, `status` = ?, `updated_date` = now() WHERE `no` = ?',
                [email, fname, lname, rank_no, phone, gender, status, req.params.no], (err, results) => {
                    if (err) {
                        console.error('เกิดข้อผิดพลาดในการอัปเดตพนักงาน:', err);
                        return res.status(500).json({ message: 'เกิดข้อผิดพลาดในการอัปเดตพนักงาน' });
                    }
                    res.json(results);
                }
            );
            console.log("อัปเดตข้อมูลพนักงานสำเร็จ");
        });
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตพนักงาน', error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

// อัปเดตสถานะพนักงาน
exports.updateEmployeeStatus = async (req, res) => {
    try {
        const { status, employee_no } = req.body;
        connection.query('UPDATE `employees` SET `status` = ?, `employee_no` = ?, `updated_date` = now() WHERE `no` = ?',
            [status, employee_no, req.params.no], function (err, results) {
                if (err) {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะพนักงาน:', err);
                    return res.status(500).json({ message: 'ข้อผิดพลาดในการอัปเดตสถานะพนักงาน' });
                }
                res.json(results);
            }
        );
        console.log("อัปเดตข้อมูลพนักงานสำเร็จ");
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตสถานะพนักงาน', error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

// ลบข้อมูลพนักงาน
exports.deleteEmployee = (req, res) => {
    try {
        const EmployeeId = req.params.no;
        connection.query('DELETE FROM `employees` WHERE no = ?',
            [EmployeeId], function (err, results) {
                if (err) {
                    console.error('เกิดข้อผิดพลาดในการลบพนักงาน:', err);
                    return res.status(500).json({ message: 'ข้อผิดพลาดในการลบพนักงาน' });
                }
                res.json({ message: "ลบข้อมูลพนักงานเรียบร้อย", results });
            }
        );
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการลบพนักงาน', error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

// ดึงข้อมูลพนักงานตามสถานะ
exports.getEmployeesByStatus = (req, res) => {
    const no = req.params.no;
    connection.query('SELECT * FROM `employees` WHERE `status` = ?',
      [no], function (err, results) {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลพนักงานตามสถานะ:', err);
            return res.status(500).json({ message: 'ข้อผิดพลาดในการดึงข้อมูลพนักงานตามสถานะ' });
        }
        res.json(results);
      }
    );
}
