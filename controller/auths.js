require("dotenv").config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secret = process.env.secret;
const { connection } = require("../database");

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    connection.query(
      "SELECT * FROM `employees` WHERE `email` = ?", 
      [email], 
      async function (err, results) {
        if (err) {
          console.error("ข้อผิดพลาดในการเข้าสู่ระบบ", err);
          return res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
        }

        const employeeData = results[0];

        if (!employeeData) {
          return res.status(400).json({ message: "เข้าสู่ระบบล้มเหลว (อีเมลหรือรหัสผ่านไม่ถูกต้อง)" });
        }

        const match = await bcrypt.compare(password, employeeData.password);
        if (!match) {
          return res.status(400).json({ message: "เข้าสู่ระบบล้มเหลว (อีเมลหรือรหัสผ่านไม่ถูกต้อง)" });
        }

        const token = jwt.sign(
          { email: employeeData.email, no: employeeData.no },
          secret,
          { expiresIn: "3h" }
        );
        res.cookie("token", token, {
          maxAge: 3600000,
          secure: process.env.NODE_ENV === "production",
          httpOnly: true,
          sameSite: "none",
        });

        res.json({ success: true, token: token });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.token;

    if (!token) {
      return res.status(401).json({ message: "ไม่ได้รับอนุญาต" });
    }

    const decoded = jwt.verify(token, secret);
    const [results] = await connection.promise().query(
      "SELECT * FROM employees WHERE no = ?", 
      decoded.no
    );
    const employeeData = results[0];

    if (!employeeData) {
      return res.status(401).json({ message: "ไม่ได้รับอนุญาต" });
    }

    res.json({
      user: {
        no: employeeData.no,
        fname: employeeData.fname,
        lname: employeeData.lname,
        email: employeeData.email,
        ranks_id: employeeData.ranks_id,
        status: employeeData.status,
        picture: employeeData.picture,
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "ข้อผิดพลาดภายในเซิร์ฟเวอร์" });
  }
};

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.json({ result: "สำเร็จ", message: "ออกจากระบบสำเร็จ" });
};

exports.register = async (req, res) => {
  try {
    const { email, password, fname, lname, ranks_id, phone, gender, picture, status, created_date, updated_date } = req.body;
    connection.query(
      'SELECT COUNT(*) AS count FROM employees WHERE email = ?', 
      [email], 
      async function (err, results) {
        if (err) {
          console.error('ข้อผิดพลาดในการตรวจสอบอีเมล', err);
          return res.status(500).json({ message: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์' });
        }

        if (results[0].count > 0) {
          return res.status(400).json({ message: 'อีเมลนี้ถูกใช้งานแล้ว' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const employeeData = {
          email,
          password: hashedPassword,
          fname,
          lname,
          ranks_id,
          phone,
          gender,
          picture,
          status,
          created_date,
          updated_date,
        };

        connection.query('INSERT INTO employees SET ?', employeeData, function (err, results) {
          if (err) {
            console.error('การสร้างผู้ใช้งานล้มเหลว', err);
            return res.status(500).json({ message: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์' });
          }
          res.json({ message: 'สร้างผู้ใช้งานสำเร็จ', results });
        });
      }
    );

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'ข้อผิดพลาดภายในเซิร์ฟเวอร์' });
  }
};
