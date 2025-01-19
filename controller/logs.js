const { connection } = require('../database');

exports.getLog = (req, res) => {
  connection.query('SELECT * FROM `logs`',
    function (err, results, fields) {
      res.json(results);
    }
  );
}

exports.getLogByType = (req, res) => {
  const type = req.params.no;
  connection.query('SELECT * FROM `logs` WHERE `type` = ?',
    [type], function (err, results) {
      res.json(results);
    }
  );
}

exports.addLog = (req, res) => {
  try {
    const { action, name, edit_no, detail, type, employee_name, employee_email, employee_picture, created_date } = req.body;
    const logData = {
      action,
      name,
      edit_no,
      detail,
      type,
      employee_name,
      employee_email,
      employee_picture,
      created_date,
    }
    connection.query('INSERT INTO `logs` SET ?',
      logData, function (err, results) {
        res.json(results);
      }
    );

  } catch (error) {
    console.log("เพิ่มประวัติไม่สำเร็จ", error);
    return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
}

exports.deleteLog = (req, res) => {
  try {
    const LogNo = req.params.no;
    connection.query('DELETE FROM `logs` WHERE no = ?',
      [LogNo], function (err, results) {
        res.json({ message: "ลบประวัติสำเร็จ", results });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
}