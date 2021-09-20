const rateLimit = require('express-rate-limit');
const { APP_CONSTANTS } = require('../constants');
/**
 * this middleware will check client requests before process by api limit config, throw error if he/she exceed limt
 */
module.exports = rateLimit({
    windowMs: APP_CONSTANTS.API_CALL_WINDOW_IN_MILLISECONDS,
    max: APP_CONSTANTS.MAX_API_CALL_IN_WINDOW,
    handler: function (req, res) {
        res.status(429).send({
            success: false,
            message: APP_CONSTANTS.API_RESPONSES.TOO_MANY_REQUESTS.MESSAGE,
            code: APP_CONSTANTS.API_RESPONSES.TOO_MANY_REQUESTS.CODE,
            errors: [{ msg: APP_CONSTANTS.API_RESPONSES.TOO_MANY_REQUESTS.MESSAGE }]
        });
    }
});
