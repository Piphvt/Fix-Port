const express = require('express');
const router = express.Router();

const { login, refresh, logout, register, forgotPassword, verifyOTP, resetPassword } = require('../controller/auths.js');

router.post('/login', login);
router.get('/refresh', refresh);
router.delete('/logout', logout);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/verify-otp', verifyOTP);
router.post('/reset-password', resetPassword);

module.exports = router;
