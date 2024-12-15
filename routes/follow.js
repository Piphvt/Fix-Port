const express = require('express');
const router = express.Router();

const { getFollow, getFollowsByResult, addFollow, updateFollow, deleteFollow} = require('../controller/follows');

router.get('/', getFollow);
router.get('/result/:no', getFollowsByResult);
router.post('/', addFollow);
router.put('/update-follow/:no', updateFollow);
router.delete('/:no', deleteFollow);

module.exports = router;