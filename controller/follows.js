const { connection } = require('../database');

exports.getFollow = (req, res) => {
    connection.query('SELECT * FROM `stocks_follow`',
        function (err, results, fields) {
            res.json(results);
        }
    );
}

exports.getFollowByResult = (req, res) => {
    const result = req.params.no;
    connection.query('SELECT * FROM `stocks_follow` WHERE `result` = ?',
        [result], function (err, results) {
            res.json(results);
        }
    );
}

exports.addFollow = async (req, res) => {
    try {
        const { stock_no, low_price, up_price, remark, result, reach, employee_no, created_date, updated_date } = req.body;
        
        const followData = {
            stock_no,
            low_price,
            up_price,
            remark,
            result,
            reach,
            employee_no,
            created_date,
            updated_date,
        };

        connection.query('INSERT INTO `stocks_follow` SET ?', [followData], function (err, results) {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลการติดตามหุ้น" });
            }
            res.json({ message: "เพิ่มข้อมูลการติดตามหุ้นใหม่สำเร็จ", results });
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
};

exports.updateFollow = async (req, res) => {
    try {
        const { stock_no, low_price, up_price, remark, employee_no } = req.body;
        const stockId = req.params.no;
        const updatedData = {
            stock_no,
            low_price,
            up_price,
            remark,
            employee_no,
            created_date: new Date()
        };

        connection.query("UPDATE `stocks_follow` SET ? WHERE `no` = ?", [updatedData, stockId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตหุ้น" });
            }
            res.json({ message: "อัปเดตข้อมูลการติดตามหุ้นสำเร็จ", results });
        });

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตการติดตามหุ้น", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.updateFollowResult = async (req, res) => {
    try {
        const { result, reach, employee_no } = req.body;
        connection.query('UPDATE `employees` SET `result` = ?, `reach` = ?, `employee_no` = ?, `updated_date` = now() WHERE `no` = ?',
            [result, reach, employee_no, req.params.no], function (err, results) {
                res.json(results);
            }
        );
        console.log("อัปเดตข้อมูลการติดตามหุ้นสำเร็จ");
    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตพนักงาน", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteFollow = (req, res) => {
    try {
        const FollowId = req.params.no;
        connection.query('DELETE FROM `stocks_follow` WHERE no = ?', [FollowId], function (err, results) {
            res.json(results);
        }
        );

        console.log("ลบข้อมูลการติดตามหุ้นสำเร็จ");

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการลบ Follow", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}
