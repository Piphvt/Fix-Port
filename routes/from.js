const express = require('express');
const router = express.Router();

const { getFrom, addFrom, updateFrom, deleteFrom } = require('../controller/froms');

router.get('/', getFrom);
router.post('/', addFrom)
router.put('/update-from/:no', updateFrom);
router.delete('/:no', deleteFrom);

module.exports = router;
