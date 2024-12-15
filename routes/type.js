const express = require('express');
const router = express.Router();

const { getType, addType, updateType, deleteType } = require('../controller/types');

router.get('/', getType);
router.post('/', addType)
router.put('/update-type/:no', updateType);
router.delete('/:no', deleteType);

module.exports = router;
