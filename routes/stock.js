const express = require('express');
const router = express.Router();

const { getStock, addStock, updateStock, deleteStock, updateStockStaff } = require('../controller/stocks');

router.get('/', getStock);
router.post('/', addStock);
router.put('/update-stock/:no', updateStock);
router.delete('/:no', deleteStock);
router.put('/update-stock-staff/:no', updateStockStaff);

module.exports = router;