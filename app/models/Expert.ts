import { Schema, Types, model } from 'mongoose';
import { IExpert } from '../@types/IExpert';

export const ExpertSchema = new Schema<IExpert>({
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

export default model<IExpert>('Expert', ExpertSchema);
