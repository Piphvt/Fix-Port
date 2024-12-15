const { connection } = require('../database');

exports.getRank = (req, res) => {
    connection.query('SELECT * FROM `ranks`', 
        function(err, results, fields) {
            res.json(results);
        }
    );
}

exports.addRank = async (req, res) => {
    try {
        const { rank, employee_no, created_date } = req.body;
        connection.query('SELECT * FROM `ranks` WHERE `rank` = ?',
            [rank], function (err, results) {
                if (results.length > 0) {
                    return res.status(400).json({ message: "ตำแหน่งนี้มีอยู่แล้ว" });
                } else {
                    const rankData = {
                        rank,
                        employee_no,
                        created_date,
                    }
                    connection.query('INSERT INTO `ranks` SET ?',
                        [rankData], function (err, results) {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มตำแหน่ง" });
                            }
                            res.json({ message: "เพิ่มตำแหน่งใหม่สำเร็จ", results });
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

exports.updateRank = (req, res) => {
    try {
        const { rank, employee_no } = req.body;
        connection.query("UPDATE `ranks` SET `rank` = ? , `employee_no` = ? , `created_date`= now() WHERE no = ?", 
            [rank, employee_no, req.params.no], function(err, results) {
            res.json(results);
        }
    );
        console.log("อัปเดตตำแหน่งสำเร็จ");

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตตำแหน่ง", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteRank = (req, res) => {
    try {
        const RankId = req.params.no;
        connection.query('DELETE FROM `ranks` WHERE no = ?', [RankId], function(err, results) {
            res.json(results);
        }
    );

        console.log("ลบตำแหน่งสำเร็จ");

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการลบตำแหน่ง", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}
