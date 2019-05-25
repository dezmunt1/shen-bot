const Scene = require('telegraf/scenes/base');
const {Random} = require('random-js');
const {postmeMongoListener, } = require('../utils/mongoListener');
const serviceMsg = require('../models/serviceMsg');

const random = new Random();

const mess = {};

const replys = (ctx, params) => { // main
    
    const channPostTrue = ctx.channelPost ? (ctx.channelPost.text.slice(8)).toLowerCase() : false; 

    if ((ctx.match && ctx.match[1].toLowerCase() === 'options') || params === 'options' || channPostTrue === 'options') {
        ctx.deleteMessage( delCommandMsg(ctx) );
        
        ctx.reply('Настроим репостер ⚙', {reply_markup:
            {inline_keyboard: [
                    [{ text: '📃 Откуда репостим', callback_data: 'selectSource', hide: false}],
                    [{ text: '📌 Выбрать чат как источник', callback_data: 'setSource', hide: false}],
                    [{ text: '✔️ Выбрать тип контента', callback_data: 'typeSource:current', hide: false }],
                    [{ text: '🗑 Удалить чат из источников', callback_data: 'delSource', hide: false }]
                ]
            }
        }
        ).then( ctx_then => {
            mess['chat_id'] = ctx_then.chat.id;
            mess['message_id'] = ctx_then.message_id;
        })
        .catch(err => console.log(err));
    } else {
        ctx.reply('Ожидайте')
            .then( ctx_then => {
                mess.timeStart = new Date(2019, 0, 1);
                timer.start();
            });
        getPost(ctx);        
    }
};

const selectSource = (ctx) => {
    postmeMongoListener(ctx, {selected: true})
        .then( returned => {
            let customExtra = {};
            let message = '';
            if (returned === false) {
                message = '🤖Список ресурсов пуст!';
                customExtra = {parse_mode: 'HTML'};
            } else {
                const cbButtons = genListResources(returned);
                message = '<b>Выберите один из доступных ресурсов:</b>';
                customExtra =  { reply_markup: {inline_keyboard: cbButtons}, parse_mode: 'HTML'};
            };

            ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, message , customExtra)
                .then(ctx_then => {
                    if (!returned) {
                        setTimeout(() => {
                            ctx.deleteMessage(ctx_then.message_id);
                        }, 1000 * 15);
                    }
                    
                })
                .catch(err => {
                    if (err.message === serviceMsg.cb400) {
                        ctx.answerCbQuery('Этот опрос не актуален', false);
                    }
                    console.log(err);
                })
        })
};

const setSource = (ctx) => {   
    postmeMongoListener(ctx, {adding: true})
        .then( (res) => { 
            const message = res === true ? `Чат уже в базе данных` : 'Чат добавлен в базу данных';
            
            ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, message )
                .then(ctx_then => {
                    setTimeout(() => {
                        ctx.deleteMessage(ctx_then.message_id);
                    }, 1000 * 15);
                })
                .catch(err => {
                    if (err.message === serviceMsg.cb400) {
                        ctx.answerCbQuery('Этот опрос не актуален', false);
                    }
                    console.log(err);
                })
        }) 
};

const selectedSource = (ctx, resource) => {
    postmeMongoListener(ctx, {listening: resource})
        .then( returned => {
            ctx.answerCbQuery(returned, true)
                .then( () => {
                    ctx.deleteMessage(ctx.callbackQuery.message.message_id);
                });
        })
        .catch(err => {
            if (err.message === serviceMsg.cb400) {
                ctx.answerCbQuery('Этот опрос не актуален', false);
            }
            console.log(err);
        })
}

const typeSource = (ctx, msgType) => {
    const cbButtons = [[{ text: `🖼 Фото ${checkBox(msgType.photo)}`, callback_data: 'typeSource:photo', hide: false }, { text: `🎥 Видео ${checkBox(msgType.video)}`, callback_data: 'typeSource:video', hide: false },{ text: `🔗 Ссылки ${checkBox(msgType.links)}`, callback_data: 'typeSource:links', hide: false }],
                [{ text: `♾ Любой ${checkBox(msgType.all)}`, callback_data: 'typeSource:all', hide: false }],
                [{ text: `🔰 Выход 🔰`, callback_data: 'deleteThisMsg', hide: false }]
    ];
    const customExtra = { reply_markup: {inline_keyboard: cbButtons}, parse_mode: 'HTML'};
    const message = 'Выберите какой контент вы готовы получать';

    ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, message , customExtra)
                .catch(err => {
                    if (err.message === serviceMsg.err400_oldLink) {
                        ctx.answerCbQuery('Этот опрос не актуален', false);
                    };
                    console.log(err);
                })
};

const delSource = (ctx) => {
    postmeMongoListener(ctx, {delete: true})
    .then( (res) => { 
        const message = res === true ? `Чат успешно удален` : 'Чата в источниках нет!';
        
        ctx.telegram.editMessageText(mess.chat_id, mess.message_id, null, message )
            .then(ctx_then => {
                setTimeout(() => {
                    ctx.deleteMessage(ctx_then.message_id);
                }, 1000 * 15);
            })
            .catch(err => {
                if (err.message === serviceMsg.err400_oldLink) {
                    ctx.answerCbQuery('Этот опрос не актуален', false);
                }
                console.log(err);
            })
    });
};

function genListResources(arr) {
    const cbBtns = arr.map( resource => {
        let resourseType = '';
        switch (resource.chatType) {
            case 'channel':
                resourseType = '📣';
                break;
            case 'group':
                resourseType = '🗣';
                break;
            case 'supergroup':
                resourseType = '🗣';
                break;
            case 'private':
                resourseType = '👩🏻‍💻';
                break;
        };
        return [{ text: `${resourseType} ${resource.title || resource.username}`, callback_data: `selectedSource:${resource.chatID}`, hide: false}]
    });
    return cbBtns;
}
function checkBox(bool) {
    return bool === true ? '✅' : '⬜️'

}
const timer = {
    start: (date) => {
        this.increment = 0;
        this.startDate = date;
        this.waitTime = setInterval(() => {
            newSec = mess.timeStart.setSeconds(mess.timeStart.getSeconds() + 1);
            mess.timeStart = new Date(newSec);
            ctx.telegram.editMessageText(ctx_then.chat.id, ctx_then.message_id, null, message);
        }, 1000);
        
        return `Ожидайте ${mess.timeStart.getMinutes()}:${mess.timeStart.getSeconds()}`
    },
    stop: () => {
        clearInterval(this.waitTime);
    },
    
};

function delCommandMsg(ctx) {
    return ctx.message === undefined ? ctx.channelPost.message_id : ctx.message.message_id;
}
let bue;
function getPost (ctx) {
    postmeMongoListener(ctx, {getPost: 'sendPost'})
        .then( result => {
            if (typeof(result) === 'string') {
                ctx.reply(result, {parse_mode: 'HTML'})
                    .then(ctx_then => {
                        setTimeout(() => {
                            ctx.deleteMessage(ctx_then.message_id);
                        }, 1000 * 15);
                    }) 
            } else {
                const messageId = random.integer(1, result.maxMsgId);
                ctx.telegram.forwardMessage(process.env.BUFFER_CHAN, result.chatID, messageId, {disable_notification: true})
                    .then(messeg => {
                        contentFilter(ctx, result, messeg);
                        if (bue) clearTimeout(bue);
                        return;
                    })
                    .catch(err => {
                        if (err.message = 'Error: 400: Bad Request: message to forward not found') {
                            bue = setTimeout( () => {
                                getPost(ctx)
                            }, 30)
                        };
                    });
            };
        });

}        
function contentFilter(ctx, result, message) {
    postmeMongoListener(ctx, {getPost: 'getThisChat'})
        .then( currentTypes => {
            messageId = message.forward_from_message_id;
            if (currentTypes.all) {
                clearInterval(mess.waitTime);
                ctx.telegram.forwardMessage(ctx.chat.id, result.chatID, messageId);
                return;
            };
            if (currentTypes.photo && message.photo) {
                clearInterval(mess.waitTime);
                ctx.telegram.forwardMessage(ctx.chat.id, result.chatID, messageId);
                return;
            };
            if (currentTypes.video && message.video) {
                clearInterval(mess.waitTime);
                ctx.telegram.forwardMessage(ctx.chat.id, result.chatID, messageId);
                return;
            };
            if (currentTypes.links) {
                ctx.telegram.forwardMessage(ctx.chat.id, result.chatID, messageId);
                return;
            };
            getPost(ctx);
            return;
        })
}

module.exports = {
    replys,
    selectSource,
    selectedSource,
    setSource,
    delSource,
    typeSource
}