import { GridFsStorage } from 'multer-gridfs-storage';
import multer from 'multer';
import { Request } from 'express';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongoose/node_modules/mongodb';
import { IFileInfo } from '../@types/IFileInfo';

export let bucket: GridFSBucket;

export let multerStorage = new GridFsStorage({
	url: process.env.MONGOATLAS as string,
	file: (req: Request, file): Promise<IFileInfo> => {
		console.log(`--- multerStorage/file`, file);
		return new Promise(resolve => {
			const fileInfo: IFileInfo = {
				filename: file.originalname,
				bucketName: 'images'
			};
			resolve(fileInfo);
		});
	}
});

export const upload = multer({ storage: multerStorage });

export async function startDataBase(): Promise<void> {
	try {
		const mongooseConnect = await mongoose.connect(
			process.env.MONGOATLAS as string
		);

		bucket = new mongoose.mongo.GridFSBucket(mongooseConnect.connection.db, {
			bucketName: 'images'
		}) as GridFSBucket;

		console.log(`--- mongo/start/host: ${mongooseConnect.connection.host}`);
	} catch (error) {
		console.log('--- mongo/start/error:', error);
	}
}

export async function testStorage() {
	try {
		const { db, client } = await multerStorage.ready();

		console.log(
			`\n--- testStorage/db.databaseName:`,
			db.databaseName,
			`\n--- testStorage/client?.options?.credentials?.username:`,
			client?.options?.credentials?.username
		);
	} catch (err) {
		console.log(`--- multerStorage/error:`, err);
	}
}
