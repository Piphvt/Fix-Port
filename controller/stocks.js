const { connection } = require('../database');

exports.getStock = (req, res) => {
    connection.query('SELECT * FROM `stocks`',
        function (err, results, fields) {
            res.json(results);
        }
    );
}

exports.addStock = async (req, res) => {
    try {
        const { stock, set_no, closing_price, comment, employee_no, created_date, updated_date } = req.body;
        connection.query('SELECT * FROM `stocks` WHERE `stock` = ?',
            [stock], function (err, results) {
                if (results.length > 0) {
                    return res.status(400).json({ message: "ชื่อหุ้นนี้มีอยู่แล้ว" });
                } else {
                    const customerData = {
                        stock,
                        set_no,
                        closing_price,
                        comment,
                        employee_no,
                        created_date,
                        updated_date,
                    }
                    connection.query('INSERT INTO `stocks` SET ?',
                        [customerData], function (err, results) {
                            if (err) {
                                console.error(err);
                                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการเพิ่มหุ้น" });
                            }
                            res.json({ message: "เพิ่มหุ้นใหม่สำเร็จ", results });
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

exports.updateStock = async (req, res) => {
    try {
        const { stock, set_no, closing_price, comment, employee_no } = req.body;
        const stockId = req.params.no;
        const [existingStocks] = await connection.promise().query('SELECT * FROM `stocks` WHERE `stock` = ? AND `no` != ?', [stock, stockId]);
        if (existingStocks.length > 0) {
            return res.status(400).json({ message: "ชื่อหุ้นนี้มีอยู่แล้ว" });
        }
        const updatedData = {
            stock,
            set_no,
            closing_price,
            comment,
            employee_no,
            updated_date: new Date()
        };

        connection.query("UPDATE `stocks` SET ? WHERE `no` = ?", [updatedData, stockId], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตหุ้น" });
            }
            res.json({ message: "อัปเดตหุ้นสำเร็จ", results });
        });

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตหุ้น", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.deleteStock = (req, res) => {
    try {
        const StockId = req.params.no;
        connection.query('DELETE FROM `stocks` WHERE no = ?', [StockId], function (err, results) {
            res.json({ message: "ลบหุ้นสำเร็จ", results });
        });

        console.log("ลบหุ้นสำเร็จ");

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการลบหุ้น", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}

exports.updateClosePriceByName = async (req, res) => {
    try {
        const { stock, closing_price, employee_no } = req.body;

        const [existingStocks] = await connection.promise().query('SELECT * FROM `stocks` WHERE `stock` = ?', [stock]);
        if (existingStocks.length === 0) {
            return res.status(404).json({ message: "ไม่พบหุ้นที่มีชื่อดังกล่าว" });
        }

        const updatedData = {
            employee_no,
            closing_price,
            updated_date: new Date()
        };

        connection.query("UPDATE `stocks` SET ? WHERE `stock` = ?", [updatedData, stock], (err, results) => {
            if (err) {
                console.error(err);
                return res.status(500).json({ message: "เกิดข้อผิดพลาดในการอัปเดตราคาปิด" });
            }
            res.json({ message: "อัปเดตราคาปิดสำเร็จ", results });
        });

    } catch (error) {
        console.log("เกิดข้อผิดพลาดในการอัปเดตราคาปิด", error);
        return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
    }
}
