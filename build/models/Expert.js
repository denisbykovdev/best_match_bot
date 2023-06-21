"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExpertSchema = void 0;
const mongoose_1 = require("mongoose");
exports.ExpertSchema = new mongoose_1.Schema({
    language: {
        type: String,
        required: true
    },
    full_name: {
        type: String,
        required: true
    },
    profession: {
        type: String,
        required: true
    },
    details: {
        type: String,
        required: true
    },
    photoId: {
        type: String,
        required: true
    },
    photoName: {
        type: String,
        required: true
    },
    educationCertificatePhotoId: {
        type: String,
        required: false
    },
    educationCertificatePhotoName: {
        type: String,
        required: false
    },
    userId: {
        type: Number,
        required: true
    }
});
exports.default = (0, mongoose_1.model)('Expert', exports.ExpertSchema);
