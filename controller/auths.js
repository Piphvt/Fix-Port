require("dotenv").config();

const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const secret = process.env.secret;
const { connection } = require("../database");
const nodemailer = require('nodemailer');
const crypto = require('crypto');

// สร้าง transporter สำหรับส่งอีเมล
const transporter = nodemailer.createTransport({
  service: 'gmail', // เปลี่ยนตามเซอร์วิสที่ใช้
  auth: {
    user: process.env.EMAIL_USER, // อีเมลของคุณ
    pass: process.env.EMAIL_PASSWORD, // รหัสผ่านของอีเมลของคุณ
  },
});

// ฟังก์ชันเพื่อสร้าง OTP (One-Time Password)
function generateOTP() {
  const otp = crypto.randomInt(100000, 999999); // สร้าง OTP แบบ 6 หลัก
  return otp.toString();
}

// ฟังก์ชันส่ง OTP ไปยังอีเมล
async function sendOTPToEmail(email, otp) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: email,
    subject: 'OTP for Password Reset',
    text: `Your OTP for resetting the password is: ${otp}`,
  };

  return transporter.sendMail(mailOptions);
}

// ฟังก์ชันรีเซ็ตรหัสผ่าน (Forgot Password)
exports.forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    // ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
    connection.query('SELECT * FROM employees WHERE email = ?', [email], (err, results) => {
      if (err) {
        console.error('Database error:', err);
        return res.status(500).json({ message: 'Error checking email' });
      }

      if (results.length === 0) {
        return res.status(404).json({ message: 'Email not found' });
      }

      // สร้าง OTP
      const otp = generateOTP();

      // เก็บ OTP ในฐานข้อมูล
      connection.query('UPDATE employees SET otp = ? WHERE email = ?', [otp, email], async (err) => {
        if (err) {
          console.error('Error saving OTP to database:', err);
          return res.status(500).json({ message: 'Error saving OTP' });
        }

        try {
          // ส่ง OTP ไปที่อีเมล
          await sendOTPToEmail(email, otp);
          res.json({ message: 'OTP sent to your email' });
        } catch (sendError) {
          console.error('Error sending OTP to email:', sendError);
          res.status(500).json({ message: 'Error sending OTP' });
        }
      });
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ message: 'Error sending OTP' });
  }
};

// ฟังก์ชันสำหรับตรวจสอบ OTP
exports.verifyOTP = (req, res) => {
  const { email, otp } = req.body;

  // ตรวจสอบว่า OTP ที่กรอกตรงกับในฐานข้อมูลหรือไม่
  connection.query('SELECT * FROM employees WHERE email = ? AND otp = ?', [email, otp], (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    return res.status(200).json({ message: 'OTP verified successfully' });
  });
};

// ฟังก์ชันสำหรับรีเซ็ตรหัสผ่านใหม่
exports.resetPassword = async (req, res) => {
  const { email, newPassword } = req.body;

  // ตรวจสอบว่าอีเมลมีอยู่ในระบบหรือไม่
  connection.query('SELECT * FROM employees WHERE email = ?', [email], async (err, results) => {
    if (err) {
      return res.status(500).json({ message: 'Internal Server Error' });
    }

    if (results.length === 0) {
      return res.status(404).json({ message: 'Email not found' });
    }

    const employee = results[0];

    // การเข้ารหัสรหัสผ่านใหม่
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // อัปเดตรหัสผ่านในฐานข้อมูล
    connection.query('UPDATE employees SET password = ?, updated_date = NOW() WHERE email = ?',
      [hashedPassword, email], (err) => {
        if (err) {
          return res.status(500).json({ message: 'Error resetting password' });
        }

        return res.status(200).json({ message: 'Password reset successfully' });
      });
  });
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    connection.query("SELECT * FROM `employees` WHERE `email` = ?", [email], async function (err, results) {
      if (err) {
        console.error("Login Error", err);
        return res.status(500).json({ message: "Internal Server Error" });
      }

      const employeeData = results[0];

      if (!employeeData) {
        return res.status(400).json({ message: "Login Failed (Invalid E-Mail Or Password)" });
      }

      const match = await bcrypt.compare(password, employeeData.password);
      if (!match) {
        return res.status(400).json({ message: "Login Failed (Invalid E-Mail Or Password)" });
      }

      const token = jwt.sign({ email: employeeData.email, no: employeeData.no }, secret, { expiresIn: "3h" });
      res.cookie("token", token, {
        maxAge: 3600000,
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: "none",
      });

      res.json({ success: true, token: token });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

exports.refresh = async (req, res) => {
  try {
    const token = req.cookies.token;
    // console.log("token", token);

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, secret);
    const [results] = await connection.promise().query("SELECT * FROM employees WHERE no = ?", decoded.no);
    const employeeData = results[0];

    if (!employeeData) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json({
      user: {
        no: employeeData.no,
        fname: employeeData.fname,
        lname: employeeData.lname,
        email: employeeData.email,
        ranks_id: employeeData.ranks_id,
        status: employeeData.status,
        picture: employeeData.picture
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal Server Error" });
  }
}

exports.logout = async (req, res) => {
  res.clearCookie("token");
  res.json({ result: "Success", message: "Logout Successful" });
}

exports.register = async (req, res) => {
  try {
    const { email, password, fname, lname, ranks_id, phone, gender, picture, status, created_date, updated_date } = req.body;
    connection.query('SELECT COUNT(*) AS count FROM employees WHERE email = ?', [email], async function (err, results) {
      if (err) {
        console.error('Error Checking E-mail:', err);
        return res.status(500).json({ message: 'Internal Server Error' });
      }

      if (results[0].count > 0) {
        return res.status(400).json({ message: 'E-Mail Already Exists' });
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
          console.error('Employee Creation Failed', err);
          return res.status(500).json({ message: 'Internal Server Error' });
        }
        res.json({ message: 'Employee Created', results });
      });
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};