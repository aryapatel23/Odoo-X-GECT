const express = require('express');
const router = express.Router();
const { addHoliday, getHolidays, deleteHoliday } = require('./holidayController');

router.post('/holidays/add', addHoliday);
router.get('/holidays', getHolidays);
router.delete('/holidays/:id', deleteHoliday);

module.exports = router;
