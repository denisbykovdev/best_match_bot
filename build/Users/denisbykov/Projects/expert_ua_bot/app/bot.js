import { Telegraf, Markup } from 'telegraf';
import 'dotenv/config';
import { message } from 'telegraf/filters';
const Bot = new Telegraf(process.env.TOKEN);
let Language = 'ua';
//** preview */
//** choose language */
Bot.command('start', async (context) => {
    await context.reply('Виберіть мову:', Markup.inlineKeyboard([
        Markup.button.callback('російська', 'ru'),
        Markup.button.callback('українська', 'ua')
    ]));
});
Bot.action('ru', context => {
    Language = 'ru';
});
Bot.action('ua', context => {
    Language = 'ua';
});
//** choose expert/findExpert */
//** expert questions */
//** expert payment connection */
//** findExpert choose from list */
//** subscribe to an expert */
//** test */
Bot.on(message('text'), context => context.reply('Hello World'));
//** start */
Bot.launch();
//** enable graceful stop */
process.once('SIGINT', () => Bot.stop('SIGINT'));
process.once('SIGTERM', () => Bot.stop('SIGTERM'));
