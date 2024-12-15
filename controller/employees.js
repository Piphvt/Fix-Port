const bcrypt = require("bcrypt");
const { connection } = require("../database");

exports.getEmployee = (req, res) => {
    connection.query('SELECT * FROM `employees`',
        function (err, results, fields) {
            res.json(results);
        }
    );
}

exports.updateEmployeePassword = async (req, res) => {
    try {
        const { password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        connection.query('UPDATE `employees` SET `password`= ?, `updated_date`= now() WHERE no = ?',
            [hashedPassword, req.params.no], function (err, results) {
                res.json(results);
            }
        );

        console.log("อัปเดตรหัสผ่านพนักงานสำเร็จ");

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตรหัสผ่านพนักงาน", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.updateEmployee = async (req, res) => {
    try {
      console.log('ข้อมูลที่ได้รับ:', req.body);
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
      console.log('เกิดข้อผิดพลาดในการอัปเดตพนักงาน', error);
      return res.status(500).json({ message: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์' });
    }
}
  

exports.updateEmployeeAll = async (req, res) => {
    try {
        const { email, fname, lname, rank_no, phone, gender, status } = req.body;
        connection.query('SELECT * FROM `employees` WHERE `email` = ? AND `no` != ?', [email, req.params.no], (err, results) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการตรวจสอบอีเมล:', err);
                return res.status(500).json({ message: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์' });
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
        console.log("เกิดข้อผิดพลาดในการอัปเดตพนักงาน", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updateEmployeeStatus = async (req, res) => {
    try {
        const { status, employee_no } = req.body;
        connection.query('UPDATE `employees` SET `status` = ?, `employee_no` = ?, `updated_date` = now() WHERE `no` = ?',
            [status, employee_no, req.params.no], function (err, results) {
                res.json(results);
            }
        );
        console.log("อัปเดตข้อมูลพนักงานสำเร็จ");
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตพนักงาน", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteEmployee = (req, res) => {
    try {
        const EmployeeId = req.params.no;
        connection.query('DELETE FROM `employees` WHERE no = ?',
            [EmployeeId], function (err, results) {
                res.json({ message: "ลบข้อมูลพนักงานเรียบร้อย", results });
            }
        );

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการลบพนักงาน", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.getEmployeesByStatus = (req, res) => {
    const type = req.params.no;
    connection.query('SELECT * FROM `employees` WHERE `status` = ?',
      [type], function (err, results) {
        res.json(results);
      }
    );
}
