const express = require('express');
const router = express.Router();

const { getDividend, getDividend, addDividend, updateDividend, deleteDividend } = require('../controller/dividends');

router.get('/', getDividend);
router.post('/', addDividend);
router.put('/update-dividend/:no', updateDividend);
router.delete('/:no', deleteDividend);

module.exports = router;