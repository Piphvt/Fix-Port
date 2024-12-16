const express = require('express');
const router = express.Router();

const { getPrice, addPrice, updatePrice, deletePrice } = require('../controller/prices');

router.get('/', getPrice);
router.post('/', addPrice);
router.put('/update-price/:no', updatePrice);
router.delete('/:no', deletePrice);

module.exports = router;