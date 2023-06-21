"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.testStorage = exports.startDataBase = exports.upload = exports.multerStorage = exports.bucket = void 0;
const multer_gridfs_storage_1 = require("multer-gridfs-storage");
const multer_1 = __importDefault(require("multer"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.multerStorage = new multer_gridfs_storage_1.GridFsStorage({
    url: process.env.MONGOATLAS,
    file: (req, file) => {
        console.log(`--- multerStorage/file`, file);
        return new Promise(resolve => {
            const fileInfo = {
                filename: file.originalname,
                bucketName: 'images'
            };
            resolve(fileInfo);
        });
    }
});
exports.upload = (0, multer_1.default)({ storage: exports.multerStorage });
async function startDataBase() {
    try {
        const mongooseConnect = await mongoose_1.default.connect(process.env.MONGOATLAS
        // {
        //     useNewUrlParser: true,
        //     useUnifiedTopology: true,
        //     useCreateIndex: true
        // }
        );
        exports.bucket = new mongoose_1.default.mongo.GridFSBucket(mongooseConnect.connection.db, {
            bucketName: 'images'
        });
        console.log(`--- mongo/start/host: ${mongooseConnect.connection.host}`);
    }
    catch (error) {
        console.log('--- mongo/start/error:', error);
    }
}
exports.startDataBase = startDataBase;
async function testStorage() {
    try {
        const { db, client } = await exports.multerStorage.ready();
        console.log(`\n--- testStorage/db.databaseName:`, db.databaseName, `\n--- testStorage/client?.options?.credentials?.username:`, client?.options?.credentials?.username);
    }
    catch (err) {
        console.log(`--- multerStorage/error:`, err);
    }
}
exports.testStorage = testStorage;
