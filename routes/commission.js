const express = require('express');
const router = express.Router();

const { getCommission, addCommission, updateCommission, deleteCommission } = require('../controller/commissions');

router.get('/', getCommission);
router.post('/', addCommission)
router.put('/update-commission/:no', updateCommission);
router.delete('/:no', deleteCommission);

module.exports = router;
