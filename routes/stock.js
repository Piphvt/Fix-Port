const express = require('express');
const router = express.Router();

const { getStock, addStock, updateStock, deleteStock, updateClosePriceByName } = require('../controller/stocks');

router.get('/', getStock);
router.post('/', addStock);
router.put('/update-stock/:no', updateStock);
router.delete('/:no', deleteStock);
router.put('/update-close-price/:name', updateClosePriceByName);

module.exports = router;