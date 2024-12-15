const express = require('express');
const router = express.Router();

const { getCustomer, addCustomer, updateCustomer, deleteCustomer } = require('../controller/customers');

router.get('/', getCustomer);
router.post('/', addCustomer)
router.put('/update-customer/:no', updateCustomer);
router.delete('/:no', deleteCustomer);

module.exports = router;
