'use strict';
const express = require('express');

const router = express.Router();
const fileRoutes = require('./api/files/files');
const validationMiddleware = require('../middlewares/validationMiddleware');
const requestLimitMiddleware = require('../middlewares/requestLimitMiddleware');
// apply necessary middlewares and routes group
router.use(requestLimitMiddleware, validationMiddleware, fileRoutes);

router.use(function (req, res, next) {
    res.status(404).json({
        success: false,
        message: 'API not found',
        errors: [
            {
                msg: 'Request is undefined'
            }
        ]
    });
    next();
});

module.exports = router;
