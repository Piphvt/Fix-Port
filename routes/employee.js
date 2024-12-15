const express = require('express');
const router = express.Router();

const { getEmployee, updateEmployeePassword, updateEmployee, updateEmployeeAll, updateEmployeeStatus, deleteEmployee, getEmployeesByStatus } = require('../controller/employees');

router.get('/', getEmployee);
router.put('/update-password/:no', updateEmployeePassword);
router.put('/update-employee/:no', updateEmployee);
router.put('/update-employee-all/:no', updateEmployeeAll);
router.put('/update-employee-status/:no', updateEmployeeStatus);
router.delete('/:no', deleteEmployee);
router.get('/status/:no', getEmployeesByStatus);

module.exports = router;
