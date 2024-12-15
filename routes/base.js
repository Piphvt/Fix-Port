const express = require('express');
const router = express.Router();

const { getBase, addBase, updateBase, deleteBase } = require('../controller/bases');

router.get('/', getBase);
router.post('/', addBase)
router.put('/update-base/:no', updateBase);
router.delete('/:no', deleteBase);

module.exports = router;
