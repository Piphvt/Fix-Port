require('dotenv').config();

const fs = require('fs');
const { spawn } = require('child_process');
const express = require('express');
const cors = require('cors');
const path = require('path');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const port = process.env.PORT || 3001;
const DB_NAME = process.env.DB_NAME;

const app = express();

const employeeRoutes = require('./routes/employee');
const authRoutes = require('./routes/auth');
const logRoutes = require('./routes/log');
const fileRoutes = require('./routes/file');
const rankRoutes = require('./routes/rank');
const customerRoutes = require('./routes/customer');
const typeRoutes = require('./routes/type');
const formRoutes = require('./routes/from');
const stockRoutes = require('./routes/stock');
const setRoutes = require('./routes/set');
const baseRoutes = require('./routes/base');
const detailRoutes = require('./routes/detail');
const transactionRoutes = require('./routes/transaction');
const commissionRoutes = require('./routes/commission');
const dividendRoutes = require('./routes/dividend');
const followRoutes = require('./routes/follow');

app.use(cors({
    origin: process.env.HTTP,
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    allowedHeaders: 'Content-Type,Authorization',
}));

app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

app.use('/employee', employeeRoutes);
app.use('/auth', authRoutes);
app.use('/log', logRoutes);
app.use('/file', fileRoutes);
app.use('/rank', rankRoutes);
app.use('/customer', customerRoutes);
app.use('/type', typeRoutes);
app.use('/from', formRoutes);
app.use('/stock', stockRoutes);
app.use('/set', setRoutes);
app.use('/base', baseRoutes);
app.use('/detail', detailRoutes);
app.use('/transaction', transactionRoutes);
app.use('/commission', commissionRoutes);
app.use('/dividend', dividendRoutes);
app.use('/follow', followRoutes);

app.get('/', (req, res) => {
    console.log('The AI Quant Tech API Is Working');
    res.send('The AI Quant Tech API Is Working');
});

let pythonProcess;
app.get('/run-close-price', (req, res) => {
    console.log("ได้รับคำขอให้รันสคริปต์ close_price.py");

    const pythonScriptPath = path.join(__dirname, 'stock', 'close_price.py');
    pythonProcess = spawn('python', [pythonScriptPath]);

    pythonProcess.stdout.on('data', (data) => {
        console.log(`ผลลัพธ์จาก Python: ${data}`);
    });

    pythonProcess.stderr.on('data', (data) => {
        console.error(`ข้อผิดพลาดจาก Python: ${data}`);
    });

    pythonProcess.on('close', (code) => {
        console.log(`สคริปต์ Python เสร็จสิ้นด้วยรหัส ${code}`);
        if (code === 0) {
            const filePath = path.join(__dirname, 'stock', 'last_day_close_price.csv');
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('ข้อผิดพลาดในการอ่านไฟล์ CSV:', err);
                    return res.status(500).send('ข้อผิดพลาดในการอ่านไฟล์ CSV');
                }
                res.setHeader('Content-Type', 'text/csv');
                res.send(data);
            });
        } else {
            console.error(`ข้อผิดพลาด: สคริปต์ Python เสร็จสิ้นด้วยรหัส ${code}`);
            res.status(500).send('ข้อผิดพลาดในการรันสคริปต์ Python');
        }
    });
});

app.post('/cancel-close-price', (req, res) => {
    if (pythonProcess) {
        pythonProcess.kill('SIGINT');
        pythonProcess = null;
        console.log('สคริปต์ Python ถูกยกเลิกแล้ว');
        res.send('สคริปต์ Python ถูกยกเลิกแล้ว');
    } else {
        res.status(400).send('ไม่พบสคริปต์ Python ที่กำลังทำงาน');
    }
});

let dividendProcess;
app.get('/run-dividend-yield', (req, res) => {
    console.log("ได้รับคำขอให้รันสคริปต์ dividend_yield.py");

    const pythonScriptPath = path.join(__dirname, 'stock', 'dividend_yield.py');
    dividendProcess = spawn('python', [pythonScriptPath]);

    dividendProcess.stdout.on('data', (data) => {
        console.log(`ผลลัพธ์จาก Python: ${data}`);
    });

    dividendProcess.stderr.on('data', (data) => {
        console.error(`ข้อผิดพลาดจาก Python: ${data}`);
    });

    dividendProcess.on('close', (code) => {
        console.log(`สคริปต์ Python เสร็จสิ้นด้วยรหัส ${code}`);
        if (code === 0) {
            const filePath = path.join(__dirname, 'stock', 'dividend_yield', 'dividend_yield_data.csv');
            fs.readFile(filePath, 'utf8', (err, data) => {
                if (err) {
                    console.error('ข้อผิดพลาดในการอ่านไฟล์ CSV:', err);
                    return res.status(500).send('ข้อผิดพลาดในการอ่านไฟล์ CSV');
                }
                res.setHeader('Content-Type', 'text/csv');
                res.send(data);
            });
        } else {
            console.error(`ข้อผิดพลาด: สคริปต์ Python เสร็จสิ้นด้วยรหัส ${code}`);
            res.status(500).send('ข้อผิดพลาดในการรันสคริปต์ Python');
        }
    });
});

app.post('/cancel-dividend-yield', (req, res) => {
    if (dividendProcess) {
        dividendProcess.kill('SIGINT');
        dividendProcess = null;
        console.log('สคริปต์ผลตอบแทนจากเงินปันผลถูกยกเลิกแล้ว');
        res.send('สคริปต์ผลตอบแทนจากเงินปันผลถูกยกเลิกแล้ว');
    } else {
        res.status(400).send('ไม่พบสคริปต์ผลตอบแทนจากเงินปันผลที่กำลังทำงาน');
    }
});

app.get('/test', (req, res) => {
    console.log('เซิร์ฟเวอร์กำลังทำงาน');
    res.send('เซิร์ฟเวอร์กำลังทำงาน');
});

app.listen(port, () => {
    console.log(`${DB_NAME} กำลังทำงานบนพอร์ต ${port}`);
});

console.log('PORT:', process.env.PORT);
console.log('HTTP:', process.env.HTTP);
