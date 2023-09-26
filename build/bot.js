"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const telegraf_1 = require("telegraf");
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const database_1 = require("./services/database");
const axios_1 = __importDefault(require("axios"));
const Expert_1 = __importDefault(require("./models/Expert"));
const mongoose_1 = require("mongoose");
const formdata_node_1 = require("formdata-node");
const startWizardHandler = new telegraf_1.Composer();
const expertWizardHandler = new telegraf_1.Composer();
const researcherWizardHandler = new telegraf_1.Composer();
startWizardHandler.action(['ua', 'ru'], async (context) => {
    context.session.language = context.update.callback_query?.['data'];
    console.log(`--- Bot.session2:`, context.update.callback_query?.['data'], context.session);
    await context.editMessageText(context.session.language === 'ua'
        ? "Наш бот з пошуку експертів є інноваційним рішенням, розробленим для допомоги користувачам у пошуку та зв'язку з професіоналами в різних галузях знань. Він використовує передові алгоритми штучного інтелекту для забезпечення ефективного та точного пошуку експертів. Процес використання робота дуже простий і інтуїтивно зрозумілий. Користувач може ввести ключові слова або тему, на яку він шукає експертів. Наш бот аналізує ці дані та здійснює пошук по своїй базі даних, що містить інформацію про безліч експертів різних професійних областей. Бот надає користувачеві список експертів, які найбільше відповідають його запиту. Кожен профіль експерта містить інформацію про його кваліфікацію, досвід роботи, освіту та галузі спеціалізації. Користувач може переглянути ці профілі та вибрати найбільш відповідного експерта для своїх потреб. Коли користувач знаходить цікавого для нього експерта, бот надає різні способи зв'язку з ним. Хто Ви?"
        : 'Наш бот по поиску экспертов представляет собой инновационное решение, разработанное для помощи пользователям в поиске и связи с профессионалами в различных областях знаний. Он использует передовые алгоритмы искусственного интеллекта для обеспечения эффективного и точного поиска экспертов. Процесс использования бота очень прост и интуитивно понятен. Пользователь может ввести ключевые слова или тему, по которой он ищет экспертов. Наш бот анализирует эти данные и осуществляет поиск по своей базе данных, содержащей информацию о множестве экспертов различных профессиональных областей. Бот предоставляет пользователю список экспертов, наиболее соответствующих его запросу. Каждый профиль эксперта содержит информацию о его квалификации, опыте работы, образовании и областях специализации. Пользователь может просмотреть эти профили и выбрать наиболее подходящего эксперта для своих нужд. Когда пользователь находит интересующего его эксперта, бот предоставляет различные способы связи с ним. Кто Вы?:', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Я - експерт' : 'Я - эксперт', 'expert'),
        telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Шукаю експерта' : 'Ищу эксперта', 'researcher')
    ]));
});
startWizardHandler.action('expert', async (context) => {
    await context.scene.enter('expert-wizard');
    context.session.guestType = 'expert';
    console.log(`--- Bot.session3/expert:`, context.session);
    await context.editMessageText(context.session.language === 'ua'
        ? 'Заповніть будь-ласка анкету:'
        : 'Заполните пожалуйста анкету:', telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Далі' : 'Дальше', 'next')
        ]
    ]));
    return context.wizard.next();
});
startWizardHandler.action('researcher', async (context) => {
    await context.scene.enter('researcher-wizard');
    context.session.guestType = 'researcher';
    console.log(`--- Bot.session3/researcher:`, context.session);
    await context.editMessageText(context.session.language === 'ua'
        ? 'Для того щоб продовжити підпишіться на канал нижче:'
        : 'Для того чтобы продолжить подпишитесь на канал ниже:', telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.url(context.session.language === 'ua' ? 'Підписатись?' : 'Подписаться?', `https://t.me/${process.env.CHANNEL_TO_SUBSCRIBE_NAME}`)
        ],
        [
            telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Далі' : 'Дальше', 'subscribed')
        ]
    ]));
});
const startWizard = new telegraf_1.Scenes.WizardScene('start-wizard', startWizardHandler);
const expertWizard = new telegraf_1.Scenes.WizardScene('expert-wizard', expertWizardHandler, async (context) => {
    context.session.__scenes.cursor = 1;
    console.log(`--- Bot.session4:`, context.session);
    await context.editMessageText(context.session.language === 'ua' ? 'Ваша професія:' : 'Ваша профессия:', telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Лікар' : 'Врач', context.session.language === 'ua' ? 'Лікар' : 'Врач')
        ],
        [telegraf_1.Markup.button.callback('Юрист', 'Юрист')],
        [telegraf_1.Markup.button.callback('Психолог', 'Психолог')],
        [
            telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог', context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог')
        ]
    ]));
    return context.wizard.next();
}, async (context) => {
    context.session.__scenes.cursor = 2;
    context.session.profession = context.update['callback_query']?.data;
    console.log(`--- Bot.session5:`, context.session);
    await context.reply(context.session.language === 'ua'
        ? 'Опишіть Вашу діяльність.'
        : 'Опишите Вашу деятельность.', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Назад' : 'Назад', 'back')
    ]));
    return context.wizard.next();
}, async (context) => {
    if (context.update['callback_query']?.data === 'back') {
        return await context.wizard['steps'][context.wizard.cursor - 2](context);
    }
    context.session.__scenes.cursor = 3;
    //try
    // context.scene.session.cursor = 3
    context.session.details = context.message?.['text'];
    console.log(`--- Bot.session6:`, context.message?.['text'], context.session);
    await context.reply(context.session.language === 'ua'
        ? "Напишіть Ваше прізвище, ім'я, по батькові."
        : 'Напишите Вашу фамилию, имя, отчество.', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Назад' : 'Назад', 'back-1')
    ]));
    return context.wizard.next();
}, async (context) => {
    if (context.update['callback_query']?.data === 'back-1') {
        return await context.wizard['steps'][context.wizard.cursor - 2](context);
    }
    context.session.__scenes.cursor = 4;
    if (context.message?.['text'])
        context.session.full_name = context.message?.['text'];
    console.log(`--- Bot.session7:`, context.session);
    await context.reply(context.session.language === 'ua'
        ? 'Надішліть Ваше фото. Його будуть бачить користувачи під час вибору.'
        : 'Пришлите Ваше фото. Его будут видеть пользователи при выборе.', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Назад' : 'Назад', 'back-2')
    ]));
    return context.wizard.next();
}, async (context) => {
    if (context.update['callback_query']?.data === 'back-2') {
        return context.wizard['steps'][context.wizard.cursor - 2](context);
    }
    else if (context.message?.['photo']?.[0]?.file_id === undefined) {
        return context.wizard['steps'][context.wizard.cursor - 1](context);
    }
    context.session.__scenes.cursor = 5;
    context.session.photo =
        context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id;
    console.log(`--- Bot.session8:`, context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id, context.message, context.session);
    context.message?.['photo']?.[context.message?.['photo'].length - 1]
        ?.file_id !== undefined &&
        (await context.reply(context.session.language === 'ua'
            ? 'Надішліть фото диплома або ліцензії. Цей крок не обовʼязковий, але його будуть бачить користувачи під час вибору.'
            : 'Пришлите фото диплома или лицензии. Этот шаг не обязателен, но его будут видеть пользователи при выборе.', telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Далі' : 'Дальше', 'next')
            ],
            [
                telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Назад' : 'Назад', 'back-3')
            ]
        ])));
    return context.wizard.next();
}, async (context) => {
    if (context.update['callback_query']?.data === 'back-3') {
        return await context.wizard['steps'][context.wizard.cursor - 2](context);
    }
    context.session.educationCertificatePhoto =
        context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id;
    console.log(`--- Bot.session9:`, context.message?.['photo']?.[context.message?.['photo'].length - 1]?.file_id, context.session);
    context.session.__scenes.cursor = 6;
    const photoLink = await context.telegram.getFileLink(context.session.photo);
    await context.replyWithPhoto({
        url: photoLink.href
    });
    if (context.session.educationCertificatePhoto) {
        const educationCertificatePhotoLink = await context.telegram.getFileLink(context.session.educationCertificatePhoto);
        await context.replyWithPhoto({
            url: educationCertificatePhotoLink.href
        }, {
            caption: context.session.language === 'ua'
                ? 'Сертифікат про освіту'
                : 'Cертифика об образовании'
        });
    }
    await context.replyWithMarkdownV2(context.session.language === 'ua'
        ? `анкета: 
				*ФІО* : _${context.session.full_name}_
				*Профессія* : _${context.session.profession}_
				*Деталі профессії* : _${context.session.details}_
			`
        : `анкета: 
				*ФИО* : _${context.session.full_name}_
				*Профессия* : _${context.session.profession}_
				*Детали профессии* : _${context.session.details}_
			`, telegraf_1.Markup.inlineKeyboard([
        [
            telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Далі' : 'Дальше', 'next')
        ],
        [
            telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Назад' : 'Назад', 'back-4')
        ]
    ]));
    return context.wizard.next();
}, async (context) => {
    if (context.update['callback_query']?.data === 'back-4') {
        return await context.wizard['steps'][context.wizard.cursor - 2](context);
    }
    const getInvoice = (id) => {
        const invoice = {
            // message_thread_id: ,
            chat_id: id,
            provider_token: process.env.PROVIDER_TOKEN,
            start_parameter: 'get_access',
            title: context.session.language === 'ua' ? `Оплата` : `Оплата`,
            description: context.session.language === 'ua'
                ? `Оплата за реєстрацію.`
                : `Оплата за регистрацию.`,
            currency: 'UAH',
            prices: [
                {
                    label: context.session.language === 'ua' ? `Оплатіть` : `Оплатите`,
                    amount: 1 * 100
                }
            ],
            payload: JSON.stringify({
                // Полезные данные счета-фактуры, определенные ботом, 1–128 байт. Это не будет отображаться пользователю, используйте его для своих внутренних процессов.
                unique_id: `${id}_${Number(new Date())}`,
                provider_token: process.env.PROVIDER_TOKEN
            })
        };
        return invoice;
    };
    const paymentFinal = await context.replyWithInvoice(getInvoice(context.from?.id));
    console.log(`--- paymentFinal:`, paymentFinal);
    return context.wizard.next();
});
researcherWizardHandler.action('subscribed', async (context) => {
    console.log('--- Bot/subscribed/context.session.userId:', context.session.userId);
    let chat = {};
    try {
        chat = await context.telegram.getChat(process.env.CHANNEL_TO_SUBSCRIBE_NAME);
        console.log('--- Bot/subscribed/chat:', chat);
    }
    catch (error) {
        await context.reply(context.session.language === 'ua'
            ? 'Я у списку видалених цього каналу!'
            : 'Я в списке удаленных этого канала!');
    }
    try {
        const admins = await context.telegram.getChatAdministrators(chat.id);
        console.log('--- Bot/subscribed/admins:', admins);
    }
    catch (error) {
        await context.reply(context.session.language === 'ua'
            ? 'Я не адміністратор цього каналу!'
            : 'Я не администратор этого канала!');
    }
    try {
        const member = await context.telegram.getChatMember(chat.id, context.session.userId);
        console.log('--- Bot/subscribed/member:', member);
        await context.editMessageText(context.session.language === 'ua'
            ? 'Професія эксперта:'
            : 'Профессия эксперта:', telegraf_1.Markup.inlineKeyboard([
            [
                telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Лікар' : 'Врач', context.session.language === 'ua' ? 'Лікар' : 'Врач')
            ],
            [telegraf_1.Markup.button.callback('Юрист', 'Юрист')],
            [telegraf_1.Markup.button.callback('Психолог', 'Психолог')],
            [
                telegraf_1.Markup.button.callback(context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог', context.session.language === 'ua' ? 'Нутриціолог' : 'Нутрициолог')
            ]
        ]));
    }
    catch (error) {
        await context.reply(context.session.language === 'ua'
            ? 'Ви не підписані на канал!'
            : 'Вы не подписаны на канал!');
    }
});
researcherWizardHandler.action(['Лікар', 'Юрист', 'Психолог', 'Нутриціолог', 'Врач', 'Нутрициолог'], async (context) => {
    console.log(`--- Bot.session4/researcher:`, context.update.callback_query['data'], context);
    const experts = await Expert_1.default.find({
        profession: context.update.callback_query['data'] === 'Лікар' ||
            context.update.callback_query['data'] === 'Врач'
            ? ['Лікар', 'Врач']
            : context.update.callback_query['data'] === 'Нутриціолог' ||
                context.update.callback_query['data'] === 'Нутрициолог'
                ? ['Нутриціолог', 'Нутрициолог']
                : context.update.callback_query['data']
    });
    if (experts) {
        const expertsWithPhotoes = await Promise.all(experts.map(async (ex) => await new Promise(resolve => {
            const bucketStream = database_1.bucket.openDownloadStreamByName(ex.photoName);
            const data = [];
            bucketStream.on('data', chunk => {
                data.push(chunk);
            });
            bucketStream.on('error', (error) => {
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
                await context.replyWithPhoto({
                    source: bufferBase64
                }, {
                    caption: `ФІО : ${ex.full_name}\nПрофессія : ${ex.profession}\nДеталі профессії : ${ex.details}`,
                    ...telegraf_1.Markup.inlineKeyboard([
                        [
                            telegraf_1.Markup.button.url(ex.language === 'ua' ? 'Підписатись?' : 'Подписаться?', `tg://user?id=${ex.userId}`)
                        ]
                    ])
                });
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
                });
            });
            if (ex.educationCertificatePhotoName) {
                const bucketStream = database_1.bucket.openDownloadStreamByName(ex.educationCertificatePhotoName);
                const data = [];
                bucketStream.on('data', chunk => {
                    data.push(chunk);
                });
                bucketStream.on('error', (error) => {
                    console.log(error);
                });
                bucketStream.on('end', async () => {
                    const bufferBase64 = Buffer.concat(data);
                    await context.replyWithPhoto({
                        source: bufferBase64
                    }, {
                        caption: ex.language === 'ua'
                            ? 'Сертифікат про освіту'
                            : 'Cертифика об образовании'
                    });
                    resolve({
                        ...ex,
                        photo: bufferBase64.toString()
                    });
                });
            }
        })));
    }
    else {
        await context.reply(context.session.language === 'ua'
            ? `За Вашим запитом не знайдено ні одного експерта.`
            : `По Вашему запросу не найдено ни одного эксперта.`);
    }
    // return context.wizard.next();
});
const researcherWizard = new telegraf_1.Scenes.WizardScene('researcher-wizard', researcherWizardHandler);
const Bot = new telegraf_1.Telegraf(process.env.TOKEN);
const stage = new telegraf_1.Scenes.Stage([startWizard, expertWizard, researcherWizard], {
    default: 'start-wizard'
});
stage.command('start', async (context) => {
    console.log(`--- Stage.command.start:`, context);
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
    await context.reply('Оберіть мову:', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Українська', 'ua'),
        telegraf_1.Markup.button.callback('Російська', 'ru'),
        telegraf_1.Markup.button.webApp('web-app-link', 'https://fresh-coin.onrender.com')
    ]));
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
            _id: new mongoose_1.Types.ObjectId(),
            userId: context.session.userId,
            language: context.session.language,
            full_name: context.session.full_name,
            profession: context.session.profession,
            details: context.session.details
        };
        if (context.update['callback_query']?.data === 'doc') {
            context.session.profession =
                context.session.language === 'ua' ? 'Лікар' : 'Врач';
        }
        const file = await context.telegram.getFile(context.session.photo);
        const fileLink = await context.telegram.getFileLink(file.file_id);
        console.log(`--- Bot/fileLink:`, file, fileLink);
        const response = await axios_1.default.get(fileLink.href, {
            responseType: 'arraybuffer'
        });
        const blobPhoto = new formdata_node_1.Blob([response.data], { type: 'image/jpeg' });
        const formData = new formdata_node_1.FormData();
        formData.append('save-photo', blobPhoto, 
        // Buffer.from(response.data),
        file.file_id);
        try {
            const { data } = await axios_1.default.post(`${process.env.URL}/save-photo`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            const { reqFileId, reqFileName } = data;
            console.log(`--- Bot/savedPhoto:`, reqFileId, reqFileName);
            NewExpert.photoId = reqFileId;
            NewExpert.photoName = reqFileName;
        }
        catch (error) {
            console.log(`--- Bot/savedPhoto/e:`, error);
        }
        if (context.session.educationCertificatePhoto) {
            const file = await context.telegram.getFile(context.session.educationCertificatePhoto);
            const fileLink = await context.telegram.getFileLink(file.file_id);
            console.log(`--- Bot/fileLink:`, file, fileLink);
            const response = await axios_1.default.get(fileLink.href, {
                responseType: 'arraybuffer'
            });
            const blobPhoto = new formdata_node_1.Blob([response.data], { type: 'image/jpeg' });
            const formData = new formdata_node_1.FormData();
            formData.append('save-photo', blobPhoto, file.file_id);
            try {
                const { data } = await axios_1.default.post(`${process.env.URL}/save-photo`, formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data'
                    }
                });
                const { reqFileId, reqFileName } = data;
                console.log(`--- Bot/savedPhoto:`, reqFileId, reqFileName);
                NewExpert.educationCertificatePhotoId = reqFileId;
                NewExpert.educationCertificatePhotoName = reqFileName;
            }
            catch (error) {
                console.log(`--- Bot/savedPhoto/e:`, error);
            }
        }
        const NewExpertCandidate = await Expert_1.default.create({
            ...(NewExpert)
        });
        if (NewExpertCandidate) {
            context.reply(context.session.language === 'ua'
                ? `Оплата пройшла успішно. Ваш профіль збережено.`
                : `Оплата прошла успешно. Ваш профиль сохранен.`);
        }
    };
    await saveExpertHandler();
    await context.scene.leave();
});
//** don't move */
Bot.use((0, telegraf_1.session)());
Bot.use(stage.middleware());
// Bot.use(Telegraf.log());
Bot.command('start', async (context) => {
    console.log(`--- Bot.session.1:`, context);
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
    await context.reply('Оберіть мову:', telegraf_1.Markup.inlineKeyboard([
        telegraf_1.Markup.button.callback('Українська', 'ua'),
        telegraf_1.Markup.button.callback('Російська', 'ru'),
        telegraf_1.Markup.button.webApp('web-app-link', 'https://fresh-coin.onrender.com')
    ]));
});
try {
    Bot.launch();
}
catch (error) {
    console.log(`launch e:`, error);
}
const server = (0, express_1.default)();
server.use(express_1.default.json());
server.use(express_1.default.urlencoded({
    extended: false
}));
server.post('/save-photo', database_1.upload.single('save-photo'), async (req, res) => {
    try {
        console.log(`--- Bot/server/save-photo/get:`, req.file);
        const reqFile = req.file;
        const reqFileId = reqFile.id;
        const reqFileName = reqFile.filename;
        res.status(200).send({
            reqFileId,
            reqFileName
        });
    }
    catch (error) {
        console.log(`--- Bot/server/save-photo/e:`, error);
    }
});
async function startServer() {
    try {
        server.listen(process.env.PORT, () => console.log(`--- server/start/port: ${process.env.PORT}`));
        await (0, database_1.startDataBase)();
        await (0, database_1.testStorage)();
    }
    catch (error) {
        console.log('--- server/start/error:', error);
        process.exit(1);
    }
}
startServer();
process.once('SIGINT', () => Bot.stop('SIGINT'));
process.once('SIGTERM', () => Bot.stop('SIGTERM'));
