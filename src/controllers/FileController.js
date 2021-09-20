'use strict';
const fs = require('fs');
/**
 * handle client request
 * use respective service to process client requests
 * return response to client
 */

const file = require('../models/file/files');
const { APP_CONSTANTS } = require('../constants');

// handle upload api
exports.uploadFile = (req, res) => {
    return file
        .uploadFile(req.files.file)
        .then((data) => {
            res.status(200).send({
                success: true,
                message: APP_CONSTANTS.API_RESPONSES.FILE.UPLOAD_FILE.SUCCESS.MESSAGE,
                code: APP_CONSTANTS.API_RESPONSES.FILE.UPLOAD_FILE.SUCCESS.CODE, // code for localising response
                data
            });
        })
        .catch((errors) => {
            res.status(400).send({
                success: true,
                message: APP_CONSTANTS.API_RESPONSES.FILE.UPLOAD_FILE.ERROR.MESSAGE,
                code: APP_CONSTANTS.API_RESPONSES.FILE.UPLOAD_FILE.ERROR.CODE, // code for localising response
                errors
            });
        });
};

// handle get file api
exports.getFile = async (req, res) => {
    if (process.env.PROVIDER === APP_CONSTANTS.STORAGE_PROVIDERS.GCP) {
        res.status(424).send({
            success: false,
            message: 'Unfortunately download api is not available for gcp',
            code: '0010'
        });
    } else {
        await file
            .getFileByPublicKey(req.params.publicKey)
            .then((stream) => {
                stream.on('error', (errors) => {
                    res.status(400).send({
                        success: true,
                        message: APP_CONSTANTS.API_RESPONSES.FILE.GET_FILE.ERROR.MESSAGE,
                        code: APP_CONSTANTS.API_RESPONSES.FILE.GET_FILE.ERROR.CODE, // code for localising response
                        errors: [{ msg: 'Something went wrong, might server issue' }] // TODO: take from constants
                    });
                });
                stream.on('close', () => {
                    res.end();
                });
                stream.pipe(res);
            })
            .catch((errors) => {
                res.status(404).send({
                    success: true,
                    message: APP_CONSTANTS.API_RESPONSES.FILE.GET_FILE.ERROR.MESSAGE,
                    code: APP_CONSTANTS.API_RESPONSES.FILE.GET_FILE.ERROR.CODE, // code for localising response
                    errors
                });
            });
    }
};

// handle delete file api
exports.deleteFile = (req, res) => {
    file.deleteFileByPrivateKey(req.params.privateKey)
        .then(() => {
            res.status(200).send({
                success: true,
                message: APP_CONSTANTS.API_RESPONSES.FILE.DELETE_FILE.SUCCESS.MESSAGE,
                code: APP_CONSTANTS.API_RESPONSES.FILE.DELETE_FILE.SUCCESS.CODE
            });
        })
        .catch((errors) => {
            console.log(errors);
            res.status(404).send({
                success: false,
                message: APP_CONSTANTS.API_RESPONSES.FILE.DELETE_FILE.ERROR.MESSAGE,
                code: APP_CONSTANTS.API_RESPONSES.FILE.DELETE_FILE.ERROR.CODE,
                errors
            });
        });
};
