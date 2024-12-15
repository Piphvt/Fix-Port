const { connection } = require('../database');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const profileStorage = multer.diskStorage({
    destination: function (req, file, callback) {
        const profileDir = path.join(__dirname, '../uploads/profile/');
            if (!fs.existsSync(profileDir)) {
                fs.mkdirSync(profileDir, { recursive: true });
            }
        callback(null, profileDir);
    },

    filename: function (req, file, callback) {
        const extension = file.originalname.split('.').pop();
        const baseName = file.originalname.substring(0, file.originalname.lastIndexOf('.'));
        let newFileName = file.originalname;

        fs.readdir(path.join(__dirname, '../uploads/profile/'), (err, files) => {
            if (err) {
                console.error('เกิดข้อผิดพลาดในการดึงข้อมูลจากไดเรกทอรี:', err);
                callback(err);
            } else {
                let count = 1;
                while (files.includes(newFileName)) {
                    newFileName = `${baseName}_${count}.${extension}`;
                    count++;
                }
                callback(null, newFileName);
            }
        });
    }
});

const uploadProfile = multer({ storage: profileStorage });

exports.getProfile = (req, res) => {
    fs.readdir('./uploads/profile', (err, files) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลจากไดเรกทอรี:', err);
            res.status(500).send('ข้อผิดพลาดภายในเซิร์ฟเวอร์');
        } else {
            res.json(files);
        }
    });
}

exports.getDefault = (req, res) => {
    fs.readdir('./uploads/default', (err, files) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการดึงข้อมูลจากไดเรกทอรี:', err);
            res.status(500).send('ข้อผิดพลาดภายในเซิร์ฟเวอร์');
        } else {
            res.json(files);
        }
    });
}

exports.readDefault = (req, res) => {
    const { picture } = req.params;
    res.sendFile(path.join(__dirname, `../uploads/default/${picture}`));
}

exports.readProfile = (req, res) => {
    const { picture } = req.params;
    res.sendFile(path.join(__dirname, `../uploads/profile/${picture}`));
}

exports.downloadProfile = (req, res) => {
    const { picture } = req.params;
    res.download(path.join(__dirname, `../uploads/profile/${picture}`));
}

exports.uploadProfile = (req, res) => {
    uploadProfile.single('file')(req, res, (err) => {
        if (err) {
            console.error('เกิดข้อผิดพลาดในการอัปโหลดไฟล์:', err);
            res.status(500).send('ข้อผิดพลาดภายในเซิร์ฟเวอร์');
        } else {
            res.json({
                message: 'อัปโหลดไฟล์สำเร็จ',
                file: req.file
            });
        }
    });
}

exports.getPicture = (req, res) => {
    connection.query('SELECT * FROM `pictures`', 
        function(err, results, fields) {
            res.json(results);
        }
    );
}

exports.updatePicture = async (req, res) => {
    try {
        const { no, picture } = req.body;
        connection.query('UPDATE pictures SET picture = ?, created_date = now() WHERE no = ?',
            [picture, no],function(err, results) {
                if (err) {
                    console.error('เกิดข้อผิดพลาดในการอัปเดตรูป:', err);
                    return res.status(500).send('ข้อผิดพลาดภายในเซิร์ฟเวอร์');
                }

                if (results.affectedRows === 0) {
                    return res.status(404).send('ไม่พบรูปหรือไม่มีการเปลี่ยนแปลง');
                }

                res.json({
                    message: 'อัปเดตรูปสำเร็จ',
                    results
                });
            }
        );
    } catch (error) {
        console.error('เกิดข้อผิดพลาดในการอัปเดตรูป:', error);
        res.status(500).send('ข้อผิดพลาดภายในเซิร์ฟเวอร์');
    }
}

exports.deletePicture = async (req, res) => {
    try {
        const { no } = req.params;
        const [photo] = await connection.promise().query('SELECT picture FROM pictures WHERE no = ?', [no]);

        if (photo.length === 0) {
            return res.status(404).json({ message: 'ไม่พบรูปภาพ' });
        }

        const ProfilePath = path.join(__dirname, '../uploads/profile', photo[0].picture);

        if (fs.existsSync(ProfilePath)) {
            fs.unlinkSync(ProfilePath);
        } else {
            return res.status(404).json({ message: 'ไม่พบรูป' });
        }

        await connection.promise().query('UPDATE pictures SET picture = NULL WHERE no = ?', [no]);

        res.json({ message: 'ลบรูปสำเร็จ' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'ไม่สามารถลบรูปภาพได้', error });
    }
}
