exports.APP_CONSTANTS = Object.freeze({
    FALLBACK_PROVIDER: 'local',
    FALLBACK_FOLDER: 'public',
    DATA_FILE: 'data/fileInformation.json',
    MAX_UPLOAD_SIZE: 100 * 1024 * 1024, // 100 Byte,
    API_CALL_WINDOW_IN_MILLISECONDS: 24 * 60 * 60 * 1000, // 24 hrs, 1 day
    MAX_API_CALL_IN_WINDOW: 1000,
    CLOUD_STORAGE_URL: 'https://storage.googleapis.com',
    KEY_LENGTHS: {
        PUBLIC_KEY: 16,
        PRIVATE_KEY: 32
    },
    // ! empty array will accept all type of file
    ALLOWED_FILE_FORMATS: [], // example ['image/png', 'image/jpg', 'image/jpeg']

    FILE_MAX_INACTIVE_DAYS: 7, // days
    STORAGE_PROVIDERS: {
        LOCAL: 'local',
        GCP: 'gcp'
    },
    TASKS: {
        REMOVE_INACTIVE_FILES: {
            NAME: 'remove_inactive_files',
            EXPRESSION: '0 0 * * *' // every day 12 AM
        }
    },
    API_RESPONSES: {
        TOO_MANY_REQUESTS: {
            MESSAGE: 'Too many request please try again later',
            CODE: '0006'
        },
        FILE: {
            UPLOAD_FILE: {
                SUCCESS: {
                    MESSAGE: 'File successfully uploaded',
                    CODE: '1000'
                },
                ERROR: {
                    MESSAGE: 'File uploading failed',
                    CODE: '0001',
                    MIDDLEWARE: {
                        FILE_REQUIRED: {
                            MESSAGE: 'File is required with request body',
                            CODE: '0002'
                        },
                        MAX_UPLOAD_LIMIT_EXCEEDED: {
                            MESSAGE: `Could not upload file more than ${100 * 1024 * 1024} Byte`, // TODO: take value dynamically
                            CODE: '0003'
                        },
                        INVALID_FILE_FORMAT: {
                            MESSAGE: `Invalid file format`,
                            CODE: '0004'
                        }
                    }
                }
            },
            GET_FILE: {
                ERROR: {
                    MESSAGE: 'Could not download file',
                    CODE: '0005'
                }
            },
            DELETE_FILE: {
                ERROR: {
                    MESSAGE: 'Could not delete file',
                    CODE: '0007'
                },
                SUCCESS: {
                    MESSAGE: 'File successfully deleted',
                    CODE: '1006'
                }
            }
        }
    }
});
