const { writeFileSync } = require('fs');
const dayJs = require('dayjs');
/**
 * manage files
 */
const localStorageStrategy = require('../../services/fileManager/strategies/localStrogeStrategy');
const gCloudStorageStrategy = require('../../services/fileManager/strategies/gcloudStorageStrategy');
const storageStrategyManager = require('../../services/fileManager/strategies/strategyManager');
const { APP_CONSTANTS } = require('../../constants');
const keyGenerator = require('../../services/keyGenerator/keyGenerator');
const uploadedFileInformation = require(`../../../${APP_CONSTANTS.DATA_FILE}`);

class FileManager {
    // setup provider and folder name before loading others
    constructor() {
        this.provider = process.env.PROVIDER;
        this.folder = process.env.FOLDER;
    }
    /**
     * helper function for getting parent key by its value
     * TODO: move this function outside of this module
     * @param {object} object
     * @param {string} keyName
     * @param {string} value
     * @returns {object}
     */
    #getKeyByValue(object, keyName, value) {
        return Object.keys(object).find((key) => object[key][keyName] === value);
    }

    // decide which storage will be used for file operation
    #strategyDecider() {
        switch (this.provider) {
            // use gcp storage if provider is `gcp`
            case APP_CONSTANTS.STORAGE_PROVIDERS.GCP:
                return gCloudStorageStrategy;
            default:
                // use local storage by default
                return localStorageStrategy;
        }
    }

    /**
     * try to retrieve file information by public key
     * return information as object if any file information found
     * return false if no file information found
     * TODO:  should not return false
     * @param {string} publicKey
     * @returns {object|boolean}
     */
    #getFileInformationByPublicKey(publicKey) {
        const fileInformation = uploadedFileInformation?.[this.provider]?.[publicKey];
        return fileInformation
            ? {
                  publicKey,
                  privateKey: fileInformation.privateKey,
                  fileName: fileInformation.fileName,
                  uploadedAt: fileInformation.uploadedAt,
                  lastAccessedAt: fileInformation.lastAccessedAt
              }
            : false;
    }

    /**
     * getting file information by publicKey or privateKey or fileName
     * @param {string} keyName
     * @param {string} value
     * @returns {object | boolean}
     */

    #getFile(keyName, value) {
        storageStrategyManager.setStrategy(this.#strategyDecider());
        if (keyName === 'publicKey') {
            return this.#getFileInformationByPublicKey(value);
        } else {
            const publicKey = this.#getKeyByValue(uploadedFileInformation?.[this.provider], keyName, value);
            return this.#getFileInformationByPublicKey(publicKey);
        }
    }
    /**
     * on file upload or download, update data file
     * @param {string} file
     * @param {string} content
     */
    #updateDataFile(file, content) {
        writeFileSync(file, JSON.stringify(content));
    }
    /**
     * ! let inactive means those files are not downloaded for configurable time
     * decide which files are inactive from configurable time period
     * delete each inactive files
     */
    async #removeInactiveFiles() {
        storageStrategyManager.setStrategy(this.#strategyDecider());
        Object.entries(uploadedFileInformation?.[this.provider]).map(([key, value]) => {
            const fileExpiryDate = dayJs(value.lastAccessedAt).add(APP_CONSTANTS.FILE_MAX_INACTIVE_DAYS, 'd');
            if (dayJs().isAfter(fileExpiryDate)) {
                this.deleteFileByPrivateKey(value.privateKey);
            }
        });
    }

    /**
     * accept file buffer from controller(user request)
     * upload into storage by using responsible service
     * return privateKey and publicKey on success
     * throw error on failed
     * @param {*} file
     * @returns {object | error}
     */
    async uploadFile(file) {
        // decide storage provider (gcp/local)
        storageStrategyManager.setStrategy(this.#strategyDecider());
        // get directory to upload files
        const uploadDir = this.folder;
        // get uploaded file name with extension
        const fileName = `${uploadDir}/${file.name}`;
        // check if file exists
        const { privateKey, publicKey } = this.#getFile('fileName', fileName);
        // return keys of existing file
        if (privateKey && publicKey) {
            return { privateKey, publicKey };
        } else {
            // upload to storage if file not exists
            return storageStrategyManager
                .uploadFile(file, uploadDir)
                .then(() => {
                    // get key pair from key generator
                    const { privateKey, publicKey } = keyGenerator.getKeyPair();
                    // modify data file with file information
                    uploadedFileInformation[this.provider][publicKey] = {
                        privateKey,
                        fileName: fileName,
                        uploadedAt: dayJs(),
                        lastAccessedAt: dayJs()
                    };
                    // rewrite data file with update data
                    this.#updateDataFile(APP_CONSTANTS.DATA_FILE, uploadedFileInformation);
                    return { privateKey, publicKey };
                })
                .catch((errors) => {
                    throw [errors];
                });
        }
    }
    /**
     * @param {string} publicKey
     * @returns {string | error}
     */
    async getFileByPublicKey(publicKey) {
        storageStrategyManager.setStrategy(this.#strategyDecider());
        const fileInfo = this.#getFile('publicKey', publicKey);
        if (fileInfo?.fileName) {
            uploadedFileInformation[this.provider][publicKey].lastAccessedAt = dayJs();
            this.#updateDataFile(APP_CONSTANTS.DATA_FILE, uploadedFileInformation);
            return await storageStrategyManager.downloadFile(fileInfo?.fileName);
        } else {
            throw [{ msg: 'No such file found by this key' }];
        }
    }

    /**
     * @param {string} requestedPrivateKey
     * @returns {string | error}
     */
    async deleteFileByPrivateKey(requestedPrivateKey) {
        // decide storage provider (gcp/local)
        storageStrategyManager.setStrategy(this.#strategyDecider());
        // get file information by privateKey
        const { fileName, publicKey } = this.#getFile('privateKey', requestedPrivateKey);
        if (fileName) {
            // delete file
            return storageStrategyManager
                .deleteFile(fileName)
                .then(() => {
                    uploadedFileInformation[this.provider][publicKey] = undefined;
                    this.#updateDataFile(APP_CONSTANTS.DATA_FILE, uploadedFileInformation);
                })
                .catch(() => {
                    // if file information exists but could not delete file from storage, remove file information from data file
                    uploadedFileInformation[this.provider][publicKey] = undefined;
                    this.#updateDataFile(APP_CONSTANTS.DATA_FILE, uploadedFileInformation);
                    throw [{ msg: 'Something went wrong' }];
                });
        }
        throw [{ msg: 'No file found for private key' }];
    }
    /**
     * this function will be called from schedular
     * it will remove inactive files
     */
    deleteInactiveFiles() {
        return this.#removeInactiveFiles();
    }
}
const file = new FileManager();

module.exports = file;
