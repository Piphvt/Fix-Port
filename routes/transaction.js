const express = require('express');
const router = express.Router();

const { getTransaction, addTransaction, updateTransaction, deleteTransaction } = require('../controller/transactions');

router.get('/', getTransaction);
router.post('/', addTransaction)
router.put('/update-transaction/:no', updateTransaction);
router.delete('/:no', deleteTransaction);

module.exports = router;
