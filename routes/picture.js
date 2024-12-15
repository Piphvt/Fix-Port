// routes/file.js
const express = require('express');
const router = express.Router();

const { getProfile, getDefault, downloadPicture, uploadPicture, getPicture, updatePicture, deletePicture } = require('../controller/pictures');

router.get('/profile', getProfile);
router.get('/default', getDefault);
router.get('/profile/download/:picture', downloadPicture);
router.post('/profile', uploadPicture);
router.get('/', getPicture);
router.put('/update-picture/:no', updatePicture);
router.delete('/picture/:no', deletePicture);

module.exports = router;
