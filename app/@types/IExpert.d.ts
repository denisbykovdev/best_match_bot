import { Types } from 'mongoose';

export interface IExpert {
	_id: Types.ObjectId;
	language: 'ua' | 'ru';
	full_name: string;
    userId: number;
	profession: 'Лікар' | 'Юрист' | 'Психолог' | 'Нутриціолог' | 'Врач' | 'Нутрициолог';
	details: string;
	photo: string;
	photoId: string;
	photoName: string;
	educationCertificatePhoto?: string;
	educationCertificatePhotoId?: string;
	educationCertificatePhotoName?: string;
}
