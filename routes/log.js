const express = require('express');
const router = express.Router();

const { getLog, getLogByType, addLog,deleteLog } = require('../controller/logs');

router.get('/', getLog);
router.get('/type/:no', getLogByType);
router.post('/', addLog);
router.delete('/:no', deleteLog);

module.exports = router;