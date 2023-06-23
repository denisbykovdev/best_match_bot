import { Telegraf, Markup, session, Context, Composer, Scenes } from 'telegraf';
import 'dotenv/config';
import {
	SceneSession,
	WizardSession,
	WizardSessionData
} from 'telegraf/typings/scenes';
import express, { Request, Response } from 'express';
import {
	bucket,
	startDataBase,
	testStorage,
	upload
} from './services/database';
import axios, { AxiosResponse } from 'axios';
import { GridFSBucket } from 'mongodb';
import Expert from './models/Expert';
import { Types } from 'mongoose';
import { IExpert } from './@types/IExpert';
import { Blob, FormData } from 'formdata-node';
import { Extra } from 'telegraf/lib';

interface ISession
	extends SceneSession<Scenes.WizardSessionData>,
		Partial<IExpert> {
	guestType?: 'expert' | 'researcher';
}

interface IWizardSession extends Scenes.WizardSessionData {
	// session?: ISession;
}

interface ISessionData extends Scenes.WizardSession<IWizardSession> {}

interface IBotContext extends Context {
	session: ISession;
	// scene: Scenes.SceneContextScene<IBotContext, IWizardSession>;
	scene: Scenes.SceneContextScene<IBotContext, Scenes.WizardSessionData>;
	wizard: Scenes.WizardContextWizard<IBotContext>;
}

const startWizardHandler = new Composer<IBotContext>();

const expertWizardHandler = new Composer<IBotContext>();

const researcherWizardHandler = new Composer<IBotContext>();

startWizardHandler.action(['ua', 'ru'], async context => {
	context.session.language = context.update.callback_query?.['data'];

	console.log(
		`--- Bot.session2:`,
		context.update.callback_query?.['data'],
		context.session
	);

	await context.editMessageText(
		context.session.language === 'ua'
			? "Наш бот з пошуку експертів є інноваційним рішенням, розробленим для допомоги користувачам у пошуку та зв'язку з професіоналами в різних галузях знань. Він використовує передові алгоритми штучного інтелекту для забезпечення ефективного та точного пошуку експертів. Процес використання робота дуже простий і інтуїтивно зрозумілий. Користувач може ввести ключові слова або тему, на яку він шукає експертів. Наш бот аналізує ці дані та здійснює пошук по своїй базі даних, що містить інформацію про безліч експертів різних професійних областей. Бот надає користувачеві список експертів, які найбільше відповідають його запиту. Кожен профіль експерта містить інформацію про його кваліфікацію, досвід роботи, освіту та галузі спеціалізації. Користувач може переглянути ці профілі та вибрати найбільш відповідного експерта для своїх потреб. Коли користувач знаходить цікавого для нього експерта, бот надає різні способи зв'язку з ним. Хто Ви?"
			: 'Наш бот по поиску экспертов представляет собой инновационное решение, разработанное для помощи пользователям в поиске и связи с профессионалами в различных областях знаний. Он использует передовые алгоритмы искусственного интеллекта для обеспечения эффективного и точного поиска экспертов. Процесс использования бота очень прост и интуитивно понятен. Пользователь может ввести ключевые слова или тему, по которой он ищет экспертов. Наш бот анализирует эти данные и осуществляет поиск по своей базе данных, содержащей информацию о множестве экспертов различных профессиональных областей. Бот предоставляет пользователю список экспертов, наиболее соответствующих его запросу. Каждый профиль эксперта содержит информацию о его квалификации, опыте работы, образовании и областях специализации. Пользователь может просмотреть эти профили и выбрать наиболее подходящего эксперта для своих нужд. Когда пользователь находит интересующего его эксперта, бот предоставляет различные способы связи с ним. Кто Вы?:',
		Markup.inlineKeyboard([
			Markup.button.callback(
				context.session.language === 'ua' ? 'Я - експерт' : 'Я - эксперт',
				'expert'
			),
			Markup.button.callback(
				context.session.language === 'ua' ? 'Шукаю експерта' : 'Ищу эксперта',
				'researcher'
			)
		])
	);
});

startWizardHandler.action('expert', async context => {
	await context.scene.enter('expert-wizard');

	context.session.guestType = 'expert';

	console.log(`--- Bot.session3/expert:`, context.session);

	await context.editMessageText(
		(context.session as ISession).language === 'ua'
			? 'Заповніть будь-ласка анкету:'
			: 'Заполните пожалуйста анкету:',
		Markup.inlineKeyboard([
			[
				Markup.button.callback(
					context.session.language === 'ua' ? 'Далі' : 'Дальше',
					'next'
				)
			]
		])
	);

	return context.wizard.next();
});

startWizardHandler.action('researcher', async context => {
	await context.scene.enter('researcher-wizard');

	context.session.guestType = 'researcher';

	console.log(`--- Bot.session3/researcher:`, context.session);

	await context.editMessageText(
		(context.session as ISession).language === 'ua'
			? 'Для того щоб продовжити підпишіться на канал нижче:'
			: 'Для того чтобы продолжить подпишитесь на канал ниже:',
		Markup.inlineKeyboard([
			[
				Markup.button.url(
					context.session.language === 'ua' ? 'Підписатись?' : 'Подписаться?',
					`https://t.me/${process.env.CHANNEL_TO_SUBSCRIBE_NAME!}`
				)
			],
			[
				Markup.button.callback(
					context.session.language === 'ua' ? 'Далі' : 'Дальше',
					'subscribed'
				)
			]
		])
	);
});

const startWizard = new Scenes.WizardScene<IBotContext>(
	'start-wizard',
	startWizardHandler
);

const expertWizard = new Scenes.WizardScene<IBotContext>(
	'expert-wizard',
	expertWizardHandler,
	async context => {
		context.session.__scenes.cursor = 1;

		console.log(`--- Bot.session4:`, context.session);

		await context.editMessageText(
			context.session.language === 'ua' ? 'Ваша професія:' : 'Ваша профессия:',
			Markup.inlineKeyboard([
				[
					Markup.button.callback(
						context.session.language === 'ua' ? 'Лікар' : 'Врач',
						context.session.language === 'ua' ? 'Лікар' : 'Врач'
					)
				],
				[Markup.button.callback('Юрист', 'Юрист')],
				[Markup.button.callback('Психолог', 'Психолог')],
				[
					Markup.button.callback(
						context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог',
						context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог'
					)
				]
			])
		);

		return context.wizard.next();
	},
	async context => {
		context.session.__scenes.cursor = 2;

		context.session.profession = context.update['callback_query']?.data;

		console.log(`--- Bot.session5:`, context.session);

		await context.reply(
			(context.session as ISession).language === 'ua'
				? 'Опишіть Вашу діяльність.'
				: 'Опишите Вашу деятельность.',
			Markup.inlineKeyboard([
				Markup.button.callback(
					context.session.language === 'ua' ? 'Назад' : 'Назад',
					'back'
				)
			])
		);

		return context.wizard.next();
	},
	async context => {
		if (context.update['callback_query']?.data === 'back') {
			return await context.wizard['steps'][context.wizard.cursor - 2](context);
		}

		context.session.__scenes.cursor = 3;

		context.session.details = context.message?.['text'];

		console.log(`--- Bot.session6:`, context.message?.['text'], context.session);

		await context.reply(
			context.session.language === 'ua'
				? "Напишіть Ваше прізвище, ім'я, по батькові."
				: 'Напишите Вашу фамилию, имя, отчество.',
			Markup.inlineKeyboard([
				Markup.button.callback(
					context.session.language === 'ua' ? 'Назад' : 'Назад',
					'back-1'
				)
			])
		);

		return context.wizard.next();
	},
	async context => {
		if (context.update['callback_query']?.data === 'back-1') {
			return await context.wizard['steps'][context.wizard.cursor - 2](context);
		}

		context.session.__scenes.cursor = 4;

		if (context.message?.['text'])
			context.session.full_name = context.message?.['text'];

		console.log(`--- Bot.session7:`, context.session);

		await context.reply(
			context.session.language === 'ua'
				? 'Надішліть Ваше фото. Його будуть бачить користувачи під час вибору.'
				: 'Пришлите Ваше фото. Его будут видеть пользователи при выборе.',
			Markup.inlineKeyboard([
				Markup.button.callback(
					context.session.language === 'ua' ? 'Назад' : 'Назад',
					'back-2'
				)
			])
		);

		return context.wizard.next();
	},
	async context => {
		if (context.update['callback_query']?.data === 'back-2') {
			return context.wizard['steps'][context.wizard.cursor - 2](context);
		} else if (context.message?.['photo']?.[0]?.file_id === undefined) {
			return context.wizard['steps'][context.wizard.cursor - 1](context);
		}

		context.session.__scenes.cursor = 5;

		context.session.photo =
			context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id;

		console.log(
			`--- Bot.session8:`,
			context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id,
			context.message,
			context.session
		);

		context.message?.['photo']?.[context.message?.['photo'].length - 1]
			?.file_id !== undefined &&
			(await context.reply(
				context.session.language === 'ua'
					? 'Надішліть фото диплома або ліцензії. Цей крок не обовʼязковий, але його будуть бачить користувачи під час вибору.'
					: 'Пришлите фото диплома или лицензии. Этот шаг не обязателен, но его будут видеть пользователи при выборе.',
				Markup.inlineKeyboard([
					[
						Markup.button.callback(
							context.session.language === 'ua' ? 'Далі' : 'Дальше',
							'next'
						)
					],
					[
						Markup.button.callback(
							context.session.language === 'ua' ? 'Назад' : 'Назад',
							'back-3'
						)
					]
				])
			));

		return context.wizard.next();
	},
	async context => {
		if (context.update['callback_query']?.data === 'back-3') {
			return await context.wizard['steps'][context.wizard.cursor - 2](context);
		}

		context.session.educationCertificatePhoto =
			context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id;

		console.log(
			`--- Bot.session9:`,
			context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id,
			context.session
		);

		context.session.__scenes.cursor = 6;

		const photoLink = await context.telegram.getFileLink(
			context.session.photo as string
		);

		await context.replyWithPhoto({
			url: photoLink.href
		});

		if (context.session.educationCertificatePhoto) {
			const educationCertificatePhotoLink = await context.telegram.getFileLink(
				context.session.educationCertificatePhoto as string
			);

			await context.replyWithPhoto(
				{
					url: educationCertificatePhotoLink.href
				},
				{
					caption:
						context.session.language === 'ua'
							? 'Сертифікат про освіту'
							: 'Cертифика об образовании'
				}
			);
		}

		await context.replyWithMarkdownV2(
			context.session.language === 'ua'
				? `анкета: 
				*ФІО* : _${context.session.full_name}_
				*Профессія* : _${context.session.profession}_
				*Деталі профессії* : _${context.session.details}_
			`
				: `анкета: 
				*ФИО* : _${context.session.full_name}_
				*Профессия* : _${context.session.profession}_
				*Детали профессии* : _${context.session.details}_
			`,
			Markup.inlineKeyboard([
				[
					Markup.button.callback(
						context.session.language === 'ua' ? 'Далі' : 'Дальше',
						'next'
					)
				],
				[
					Markup.button.callback(
						context.session.language === 'ua' ? 'Назад' : 'Назад',
						'back-4'
					)
				]
			])
		);

		return context.wizard.next();
	},
	async context => {
		if (context.update['callback_query']?.data === 'back-4') {
			return await context.wizard['steps'][context.wizard.cursor - 2](context);
		}

		const getInvoice = (id: number) => {
			const invoice = {
				// message_thread_id: ,
				chat_id: id, // Уникальный идентификатор целевого чата или имя пользователя целевого канала
				provider_token: process.env.PROVIDER_TOKEN as string,
				start_parameter: 'get_access', //Уникальный параметр глубинных ссылок. Если оставить поле пустым, переадресованные копии отправленного сообщения будут иметь кнопку «Оплатить», позволяющую нескольким пользователям производить оплату непосредственно из пересылаемого сообщения, используя один и тот же счет. Если не пусто, перенаправленные копии отправленного сообщения будут иметь кнопку URL с глубокой ссылкой на бота (вместо кнопки оплаты) со значением, используемым в качестве начального параметра.
				title: context.session.language === 'ua' ? `Оплата` : `Оплата`, // Название продукта, 1-32 символа
				description:
					context.session.language === 'ua'
						? `Оплата за реєстрацію.`
						: `Оплата за регистрацию.`, // Описание продукта, 1-255 знаков
				currency: 'UAH', // Трехбуквенный код валюты ISO 4217
				prices: [
					{
						label: context.session.language === 'ua' ? `Оплатіть` : `Оплатите`,
						amount: 1 * 100
					}
				], // Разбивка цен, сериализованный список компонентов в формате JSON 100 копеек * 100 = 100 рублей
				payload: JSON.stringify({
					// Полезные данные счета-фактуры, определенные ботом, 1–128 байт. Это не будет отображаться пользователю, используйте его для своих внутренних процессов.
					unique_id: `${id}_${Number(new Date())}`,
					provider_token: process.env.PROVIDER_TOKEN as string
				})
			};

			return invoice;
		};

		const paymentFinal = await context.replyWithInvoice(
			getInvoice(context.from?.id as number)
		);

		console.log(`--- paymentFinal:`, paymentFinal);

		return context.wizard.next();
	}
);

researcherWizardHandler.action('subscribed', async context => {
	console.log(
		'--- Bot/subscribed/context.session.userId:',
		context.session.userId
	);

	let chat: any = {};

	try {
		chat = await context.telegram.getChat(process.env.CHANNEL_TO_SUBSCRIBE_NAME!);

		console.log('--- Bot/subscribed/chat:', chat);
	} catch (error) {
		await context.reply(
			(context.session as ISession).language === 'ua'
				? 'Я у списку видалених цього каналу!'
				: 'Я в списке удаленных этого канала!'
		);
	}

	try {
		const admins = await context.telegram.getChatAdministrators(chat.id);

		console.log('--- Bot/subscribed/admins:', admins);
	} catch (error) {
		await context.reply(
			(context.session as ISession).language === 'ua'
				? 'Я не адміністратор цього каналу!'
				: 'Я не администратор этого канала!'
		);
	}

	try {
		const member = await context.telegram.getChatMember(
			chat.id,
			context.session.userId as number
		);

		console.log('--- Bot/subscribed/member:', member);

		await context.editMessageText(
			(context.session as ISession).language === 'ua'
				? 'Професія эксперта:'
				: 'Профессия эксперта:',
			Markup.inlineKeyboard([
				[
					Markup.button.callback(
						context.session.language === 'ua' ? 'Лікар' : 'Врач',
						context.session.language === 'ua' ? 'Лікар' : 'Врач'
					)
				],
				[Markup.button.callback('Юрист', 'Юрист')],
				[Markup.button.callback('Психолог', 'Психолог')],
				[
					Markup.button.callback(
						context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог',
						context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог'
					)
				]
			])
		);
	} catch (error) {
		await context.reply(
			(context.session as ISession).language === 'ua'
				? 'Ви не підписані на канал!'
				: 'Вы не подписаны на канал!'
		);
	}
});

researcherWizardHandler.action(
	['Лікар', 'Юрист', 'Психолог', 'Нутриціолог', 'Врач', 'Нутрициолог'],
	async context => {
		console.log(
			`--- Bot.session4/researcher:`,
			context.update.callback_query['data'],
			context
		);

		const experts = await Expert.find({
			profession:
				context.update.callback_query['data'] === 'Лікар' ||
				context.update.callback_query['data'] === 'Врач'
					? ['Лікар', 'Врач']
					: context.update.callback_query['data'] === 'Нутриціолог' ||
					  context.update.callback_query['data'] === 'Нутрициолог'
					? ['Нутриціолог', 'Нутрициолог']
					: context.update.callback_query['data']
		});

		if (experts) {
			const expertsWithPhotoes: IExpert[] = await Promise.all(
				experts.map(
					async ex =>
						await new Promise(resolve => {
							const bucketStream = (bucket as GridFSBucket).openDownloadStreamByName(
								ex.photoName
							);

							const data: any[] = [];

							bucketStream.on('data', chunk => {
								data.push(chunk);
							});
							bucketStream.on('error', (error: NativeError) => {
								console.log(error);
							});
							bucketStream.on('end', async () => {
								const bufferBase64 = Buffer.concat(data);

								// await context.editMessageMedia(
								// 	{
								// 		type: 'photo',
								// 		media: {
								// 			source: bufferBase64
								// 		},
								// 		caption: `ФІО : ${ex.full_name}\nПрофессія : ${ex.profession}\nДеталі профессії : ${ex.details}`,
								// 		...Markup.inlineKeyboard([
								// 			[
								// 				Markup.button.url(
								// 					ex.language === 'ua' ? 'Підписатись?' : 'Подписаться?',
								// 					`tg://user?id=${ex.userId}`
								// 				)
								// 			]
								// 		])
								// 	},
								// );

								await context.replyWithPhoto(
									{
										source: bufferBase64
									},
									{
										caption: `ФІО : ${ex.full_name}\nПрофессія : ${ex.profession}\nДеталі профессії : ${ex.details}`,
										...Markup.inlineKeyboard([
											[
												Markup.button.url(
													ex.language === 'ua' ? 'Підписатись?' : 'Подписаться?',
													`tg://user?id=${ex.userId}`
												)
											]
										])
									}
								);

								// await context.replyWithMarkdownV2(
								// 	ex.language === 'ua'
								// 		? `анкета:
								// 	*ФІО* : _${ex.full_name}_
								// 	*Профессія* : _${ex.profession}_
								// 	*Деталі профессії* : _${ex.details}_
								// `
								// 		: `анкета:
								// 	*ФИО* : _${ex.full_name}_
								// 	*Профессия* : _${ex.profession}_
								// 	*Детали профессии* : _${ex.details}_
								// `

								// ,
								// 	Markup.inlineKeyboard([
								// 		[
								// 			Markup.button.url(
								// 				ex.language === 'ua' ? 'Підписатись?' : 'Подписаться?',
								// 				`tg://user?id=${ex.userId}`
								// 			)
								// 		]
								// 	])
								// );

								resolve({
									...ex,
									photo: bufferBase64.toString()
								} as IExpert);
							});

							if (ex.educationCertificatePhotoName) {
								const bucketStream = (bucket as GridFSBucket).openDownloadStreamByName(
									ex.educationCertificatePhotoName
								);

								const data: any[] = [];

								bucketStream.on('data', chunk => {
									data.push(chunk);
								});
								bucketStream.on('error', (error: NativeError) => {
									console.log(error);
								});
								bucketStream.on('end', async () => {
									const bufferBase64 = Buffer.concat(data);

									await context.replyWithPhoto(
										{
											source: bufferBase64
										},
										{
											caption:
												ex.language === 'ua'
													? 'Сертифікат про освіту'
													: 'Cертифика об образовании'
										}
									);

									resolve({
										...ex,
										photo: bufferBase64.toString()
									} as IExpert);
								});
							}
						})
				)
			);
		} else {
			await context.reply(
				context.session.language === 'ua'
					? `За Вашим запитом не знайдено ні одного експерта.`
					: `По Вашему запросу не найдено ни одного эксперта.`
			);
		}

		// return context.wizard.next();
	}
);

const researcherWizard = new Scenes.WizardScene<IBotContext>(
	'researcher-wizard',
	researcherWizardHandler
);

const Bot = new Telegraf<IBotContext>(process.env.TOKEN!);

const stage = new Scenes.Stage<IBotContext>(
	[startWizard, expertWizard, researcherWizard],
	{
		default: 'start-wizard'
	}
);

stage.command('start', async context => {
	// console.log(`--- Stage.command.start:`, context);

	context.scene.leave();
	context.scene.enter('start-wizard');

	context.session = {
		...context.session,
		language: undefined,
		guestType: undefined,
		full_name: undefined,
		profession: undefined,
		details: undefined,
		photo: undefined,
		educationCertificatePhoto: undefined
	};

	context.session.userId = context.update.message.from.id;

	console.log(`--- Stage.command.start:`, context.session);

	await context.reply(
		'Оберіть мову:',
		Markup.inlineKeyboard([
			Markup.button.callback('Українська', 'ua'),
			Markup.button.callback('Російська', 'ru')
		])
	);
});

stage.on('pre_checkout_query', context => {
	console.log(`--- pre_checkout_query:`, context);

	return context.answerPreCheckoutQuery(true);
}); // ответ на предварительный запрос по оплате
stage.on('successful_payment', async (context, next) => {
	// ответ в случае положительной оплаты
	console.log(`--- successful_payment:`, context);

	// await context.reply('SuccessfulPayment');

	const saveExpertHandler = async () => {
		let NewExpert = {
			_id: new Types.ObjectId(),
			userId: context.session.userId as IExpert['userId'],
			language: context.session.language as IExpert['language'],
			full_name: context.session.full_name as IExpert['full_name'],
			profession: context.session.profession as IExpert['profession'],
			details: context.session.details as IExpert['details']
		} as Omit<IExpert, 'photo' | 'educationCertificatePhoto'>;

		if (context.update['callback_query']?.data === 'doc') {
			context.session.profession =
				context.session.language === 'ua' ? 'Лікар' : 'Врач';
		}

		const file = await context.telegram.getFile(context.session.photo as string);

		const fileLink = await context.telegram.getFileLink(file.file_id);

		console.log(`--- Bot/fileLink:`, file, fileLink);

		const response = await axios.get(fileLink.href, {
			responseType: 'arraybuffer'
		});

		const blobPhoto = new Blob([response.data], { type: 'image/jpeg' });

		const formData = new FormData();
		formData.append(
			'save-photo',
			blobPhoto,
			// Buffer.from(response.data),
			file.file_id
		);

		try {
			const { data }: AxiosResponse['data'] = await axios.post(
				`${process.env.URL}/save-photo`,
				formData,
				{
					headers: {
						'Content-Type': 'multipart/form-data'
					}
				}
			);

			const { reqFileId, reqFileName } = data as {
				reqFileId: string;
				reqFileName: string;
			};

			console.log(`--- Bot/savedPhoto:`, reqFileId, reqFileName);

			NewExpert.photoId = reqFileId;
			NewExpert.photoName = reqFileName;
		} catch (error) {
			console.log(`--- Bot/savedPhoto/e:`, error);
		}

		if (context.session.educationCertificatePhoto) {
			const file = await context.telegram.getFile(
				context.session.educationCertificatePhoto
			);

			const fileLink = await context.telegram.getFileLink(file.file_id);

			console.log(`--- Bot/fileLink:`, file, fileLink);

			const response = await axios.get(fileLink.href, {
				responseType: 'arraybuffer'
			});

			const blobPhoto = new Blob([response.data], { type: 'image/jpeg' });

			const formData = new FormData();
			formData.append('save-photo', blobPhoto, file.file_id);

			try {
				const { data }: AxiosResponse['data'] = await axios.post(
					`${process.env.URL!}/save-photo`,
					formData,
					{
						headers: {
							'Content-Type': 'multipart/form-data'
						}
					}
				);

				const { reqFileId, reqFileName } = data as {
					reqFileId: string;
					reqFileName: string;
				};

				console.log(`--- Bot/savedPhoto:`, reqFileId, reqFileName);

				NewExpert.educationCertificatePhotoId = reqFileId;
				NewExpert.educationCertificatePhotoName = reqFileName;
			} catch (error) {
				console.log(`--- Bot/savedPhoto/e:`, error);
			}
		}

		const NewExpertCandidate = await Expert.create({
			...(NewExpert satisfies Omit<IExpert, 'photo' | 'educationCertificatePhoto'>)
		});

		if (NewExpertCandidate) {
			context.reply(
				context.session.language === 'ua'
					? `Оплата пройшла успішно. Ваш профіль збережено.`
					: `Оплата прошла успешно. Ваш профиль сохранен.`
			);
		}
	};

	await saveExpertHandler();

	await context.scene.leave();
});

//** don't move */
Bot.use(session());
Bot.use(stage.middleware());
// Bot.use(Telegraf.log());

Bot.command('start', async context => {
	await context.scene.enter('start-wizard');

	context.session = {
		...context.session,
		language: undefined,
		guestType: undefined,
		full_name: undefined,
		profession: undefined,
		details: undefined,
		photo: undefined,
		educationCertificatePhoto: undefined
	};

	context.session.userId = context.update.message.from.id;

	console.log(`--- Bot.session.1:`, context.session);

	await context.reply(
		'Оберіть мову:',
		Markup.inlineKeyboard([
			Markup.button.callback('Українська', 'ua'),
			Markup.button.callback('Російська', 'ru')
		])
	);
});

try {
	Bot.launch();
} catch (error) {
	console.log(`launch e:`, error);
}

const server = express();

server.use(express.json());

server.use(
	express.urlencoded({
		extended: false
	})
);

server.get('/', (req: Request, res: Response) =>
	res.status(200).send({ checked: true })
);

server.post(
	'/save-photo',
	upload.single('save-photo'),
	async (req: Request, res: Response) => {
		try {
			console.log(`--- Bot/server/save-photo/get:`, req.file);

			const reqFile = req.file!;

			const reqFileId = (reqFile as Express.Multer.File).id;

			const reqFileName = (reqFile as Express.Multer.File).filename;

			res.status(200).send({
				reqFileId,
				reqFileName
			});
		} catch (error) {
			console.log(`--- Bot/server/save-photo/e:`, error);
		}
	}
);

async function startServer() {
	try {
		server.listen(process.env.PORT, () =>
			console.log(`--- server/start/port: ${process.env.PORT as string}`)
		);

		await startDataBase();
		await testStorage();
	} catch (error) {
		console.log('--- server/start/error:', error);
		process.exit(1);
	}
}

startServer();

setInterval(() => {
	const { data }: AxiosResponse['data'] = axios.get(`${process.env.URL!}/`, {
		headers: {
			'Content-Type': 'multipart/form-data'
		}
	});

	console.log(`--- Bot/serve check/10min:`, data);
}, 600);

process.once('SIGINT', () => Bot.stop('SIGINT'));
process.once('SIGTERM', () => Bot.stop('SIGTERM'));
