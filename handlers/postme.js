const Scene = require('telegraf/scenes/base');
const {Random} = require('random-js');
const {postmeMongoListener, } = require('../utils/mongoDB/mongoListener');
const serviceMsg = require('../models/serviceMsg');

const random = new Random();

const mess = {};

const replys = (ctx, params) => { // main
    const channPostTrue = ctx.channelPost ? (ctx.channelPost.text.slice(8)).toLowerCase() : false;

    postmeMongoListener(ctx, {getPost: 'getMediatypes'})
        .then(resolved => {
            mess.currentTypes = resolved;
        });

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
        return;
    };
    if (params === 'more') {
        ctx.answerCbQuery();
        const message_id = ctx.callbackQuery.message.message_id;
        const chatId = ctx.chat.id;
        ctx.state.redis.get('chatsPostme', (err, result) => {
            if (err) {
                console.log(err);
                return
            };
            const chatInstance = JSON.parse(result);

            if (ctx.callbackQuery.message.text || ctx.callbackQuery.message.voice || ctx.callbackQuery.message.video_note) { // Если предыдущее сообщение было текстом, затрём его
                ctx.telegram.sendPhoto(ctx.chat.id, "AgADAgADUasxG0DM0EnjG3eTgcJky7RKhA8ABBPisIHPGjR9HZcDAAEC")
                    .then(ctx_then => {
                        ctx.telegram.deleteMessage(ctx.chat.id, ctx.callbackQuery.message.message_id);
                        chatInstance[chatId] = ctx_then.message_id;
                        ctx.state.correctChat = {chatId: ctx_then.chat.id, messageId: chatInstance[chatId]};
                        ctx.state.redis.set("chatsPostme", JSON.stringify(chatInstance));
                        getPost(ctx);
                    });
                    
                return;
            };
            chatInstance[chatId] = message_id;
            ctx.state.correctChat = {chatId: chatId, messageId: chatInstance[chatId]};;
            ctx.state.redis.set("chatsPostme", JSON.stringify(chatInstance));
            getPost(ctx);
        });
        
        return
    } else {
        const redisClient = ctx.state.redis;
        ctx.telegram.sendPhoto(ctx.chat.id, "AgADAgADUasxG0DM0EnjG3eTgcJky7RKhA8ABBPisIHPGjR9HZcDAAEC")
            .then( ctx_then => {
                if (!redisClient) return;
                redisClient.get('chatsPostme', (err, result) => {
                    if (err) {
                        console.log(err);
                        return
                    };
                    const chatInstance = JSON.parse(result);
                    chatInstance[ctx.chat.id] = ctx_then.message_id;
                    ctx.state.correctChat = {chatId: ctx.chat.id, messageId: chatInstance[ctx.chat.id]};
                    redisClient.set("chatsPostme", JSON.stringify(chatInstance));
                    getPost(ctx);
                })
            });
        return;
    };
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
    const cbButtons = [[{ text: `🖼 Фото ${checkBox(msgType.photo)}`, callback_data: 'typeSource:photo', hide: false }, { text: `🎥 Видео/GIF ${checkBox(msgType.video)}`, callback_data: 'typeSource:video', hide: false },{ text: `🔗 Ссылки ${checkBox(msgType.links)}`, callback_data: 'typeSource:links', hide: false }],
                [{ text: `♾ Любой ${checkBox(msgType.all)}`, callback_data: 'typeSource:all', hide: false }, { text: `🎵 Аудио ${checkBox(msgType.audio)}`, callback_data: 'typeSource:audio', hide: false }],
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
const messageHandler = {
    wait: (message_id, ctx) => {
        this.message_id = message_id;
    },
    send: (ctx, media, messageType) => {
        const correctChatId = ctx.state.correctChat ? ctx.state.correctChat.chatId : ctx.chat.id;
        const chatId = ctx.chat.id === correctChatId ? ctx.chat.id : correctChatId || ctx.chat.id; // проверка на контектсный chatID или пересланный из буфера
        const redirectMessage = chatId === ctx.chat.id ? true : false; // необходимо ли перенаправляьт сообщение
        const messageId = ctx.state.correctChat ? ctx.state.correctChat.messageId : false;


        const extra = {reply_markup:
            {inline_keyboard: [ [ { text: '🔄 Еще', callback_data: 'getSource:more', hide: false } ] ] }
        };
        if (messageType === 'links') {
            ctx.telegram.sendMessage (correctChatId, media, extra)
                .then( ctx_then => {
                    ctx.telegram.deleteMessage(chatId, messageId);
                    messageHandler.modifyMessageId(ctx, correctChatId, ctx_then.message_id);
                })
            return
        }
        if (messageType === 'photo') {
            const photoId = (media[ media.length - 1].fileId ) || (media[ media.length - 1].file_id);
            if (redirectMessage) {
                messageHandler.redirect(ctx, photoId, 'inputMessagePhoto', messageId);
                return;
            };
            ctx.telegram.editMessageMedia(chatId, messageId, null, {type: 'photo', media: photoId}, extra);
            return;
        }
        if (messageType === 'animation') {
            if (redirectMessage) {
                messageHandler.redirect(ctx, media.fileId, 'inputMessageAnimation', messageId);
                return;
            };
            ctx.telegram.editMessageMedia(chatId, messageId, null, {type: 'animation', media}, extra);
            return;
        }
        if (messageType === 'video') {
            if (redirectMessage) {
                messageHandler.redirect(ctx, media.fileId, 'inputMessageVideo', messageId);
                return;
            };
            ctx.telegram.editMessageMedia(chatId, messageId, null, {type: 'video', media}, extra);
            return;
        }
        if (messageType === 'audio') {
            if (redirectMessage) {
                messageHandler.redirect(ctx, media.fileId, 'inputMessageAudio', messageId);
                return;
            };
            ctx.telegram.editMessageMedia(chatId, messageId, null, {type: 'audio', media}, extra);
            return
        }
        if (messageType === 'voicenote' || messageType === 'voice_note') {
            if (redirectMessage) {
                messageHandler.redirect(ctx, media, 'inputMessageVoiceNote', messageId);
                return;
            };
            
            ctx.telegram.sendVoice(chatId, media, extra)
                .then( ctx_then => {
                    ctx.telegram.deleteMessage(chatId, messageId);
                    messageHandler.modifyMessageId(ctx, correctChatId, ctx_then.message_id);
                })
            return
        }
        if (messageType === 'videonote' || messageType === 'video_note') {
            if (redirectMessage) {
                messageHandler.redirect(ctx, media, 'inputMessageVideoNote', messageId);/* "DQADAgADSAADk40ISjP78en-josaAg" */
                return;
            };
            
            ctx.telegram.sendVideoNote(chatId, media, extra)
                .then( ctx_then => {
                    ctx.telegram.deleteMessage(chatId, messageId);
                    messageHandler.modifyMessageId(ctx, correctChatId, ctx_then.message_id);
                })
            return
        }
        return
    
        /* ctx.telegram.editMessageMedia(ctx.chat.id, this.message_id, null, media, extra); */
        return;
    },
    redirect: (ctx, media, type, messageId) => {
        const chatId = ctx.chat.id;
        const message = `@sendMessage={"chatID":${chatId}, "fileId": "${media}", "type": "${type}", "messageId": ${messageId}}`;
        ctx.telegram.sendMessage ( process.env.SHEN_VISOR, message );
        return

    },
    modifyMessageId: (ctx, correctChatId, messageId) => {
        ctx.state.redis.get('chatsPostme', (err, result) => {
            if (err) {
                console.log(err);
                return
            };
            const chatInstance = JSON.parse(result);
            chatInstance[correctChatId] = messageId;
            ctx.state.correctChat = {chatId: correctChatId, messageId: messageId};
            ctx.state.redis.set("chatsPostme", JSON.stringify(chatInstance));
        })
        return
    },
    
};

function delCommandMsg(ctx) {
    return ctx.message === undefined ? ctx.channelPost.message_id : ctx.message.message_id;
};


function getPost (ctx, params) {
    if (params) {
        if (!ctx.message.caption && ctx.message.video_note) {
            contentFilter(ctx, 'videonote');
            return;
        };
        const {chatId: correctChatId, type: typeMessage} = JSON.parse(ctx.message.caption); // возмлжна вставкка на проверку чатов в списке
        if (correctChatId === ctx.state.correctChat.chatId) {
            const content = typeMessage;
            contentFilter(ctx, content);
            return;
        }
        return;
    };
    postmeMongoListener(ctx, {getPost: 'sendPost'})
        .then( result => {
            if (typeof(result) === 'string') {
                const messageId = ctx.channelPost ? ctx.channelPost.message_id + 1 : ctx.message.message_id + 1; // удалим ждуна, так как ждать нечего
                ctx.deleteMessage(messageId);
                ctx.reply(result, {parse_mode: 'HTML'})
                    .then(ctx_then => {
                        setTimeout(() => {
                            ctx.deleteMessage(ctx_then.message_id);
                        }, 1000 * 15);
                    }) 
            } else {
                const content = result;
                contentFilter(ctx, content)
            };
        });

}       

function contentFilter(ctx, content) {
    const availableTypes = Object.keys(content).slice(1);
    let correctContent,
        media,
        messageType; 
    const message = ctx.callbackQuery ? ctx.callbackQuery.message : ctx.message;

    if (content.photo) { // провеерка на объект
        correctContent = generateContent(content, mess);
        media = correctContent.content;
        messageType = correctContent.messageType;
    }
    
    if (content === 'links' || messageType === 'links') {
        if (!media) {
            media = message.text;
        };
        messageHandler.send( ctx, media, messageType || content );
        return;
    };

    if (content === 'audio' || messageType === 'audio') {
        if (!media) {
            media = message.audio.file_id;
        };
        messageHandler.send( ctx, media, messageType || content );
        return;
    };

    if (content === 'voicenote' || messageType === 'voicenote') {
        if (!media) {
            media = message.voice.file_id;
        };
        messageHandler.send( ctx, media, messageType || content );
        return;
    };

    if (content === 'animation' || messageType === 'animation') {
        if (!media) {
            media = message.animation.file_id;
        };
        messageHandler.send( ctx, media, messageType || content );
        return;
    };

    if (content === 'video' || messageType === 'video') {
        if (!media) {
            media = message.video.file_id;
        };
        messageHandler.send( ctx, media, messageType || content );
        return;
    };

    if (content === 'photo' || messageType === 'photo') {
        if (!media) {
            media = message.photo;
        };
        messageHandler.send( ctx, media, messageType || content );
        return;
    };

    if (content === 'videonote' || messageType === 'videonote') {
        if (!media) {
            media = message.video_note.file_id;
        };
        messageHandler.send( ctx, media, messageType || content );
        return;
    };
    
    return;
    
    function generateContent(content, mess) {
        let messageCategory = Object.entries(mess.currentTypes)
            .map((currentItem) => {
                if (currentItem[0] !== '$init' && currentItem[1] === true) {
                    return currentItem[0];
                };
                return
            })
            .filter(item => {
                if (item !== undefined) {
                    return item
                }
            });
        messageCategory = messageCategory[ random.integer(0, messageCategory.length - 1) ]; // если несколько выбранных категорий, выберим одну
        const messageTypes = {
            'photo': 'photo',
            'video': [ 'video', 'videonote', 'animation'][ random.integer(0, 2) ],
            'links': 'links',
            'audio': [ 'audio', 'voicenote' ][ random.integer(0, 1) ],
            'all': [ 'links', 'photo', 'animation', 'video', 'audio', 'voicenote', 'videonote'][ random.integer(0, 6) ]
        };
        const messageType = messageTypes[messageCategory];
        const unsortedContent = content[ messageType ];
        const returnedContent = unsortedContent[ Object.keys(unsortedContent)[ random.integer(0, Object.keys(unsortedContent).length -1) ] ];
        // Если контент еще не подгрузился в базу, добвим заглушку с кнопкой "ЕЩЕ"
        if (!returnedContent) {
            return {messageType: "photo", content: [{caption:false, fileId: "AgADAgADUasxG0DM0EnjG3eTgcJky7RKhA8ABBPisIHPGjR9HZcDAAEC", size: "small"}]};
        }
        return {messageType, content: returnedContent};
    };
};

module.exports = {
    replys,
    selectSource,
    selectedSource,
    setSource,
    delSource,
    typeSource,
    getPost,
}