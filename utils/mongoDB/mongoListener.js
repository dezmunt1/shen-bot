const {correctTime, formatDate} = require('../dateTransform');
const articleParser = require('../articleParser');
const Markup = require('telegraf/markup');
const {DelorianModel, RespectModel, ArticleModel, UserModel, ChatModel} = require('../../models/schemas');
const handlerMessages = require('../handlerMessages');

const dlMongoListener = function(ctx){
    setInterval(() => { // лушаем delorian
        let nowDate = formatDate(new Date());
        nowDate = `${nowDate.date}.${nowDate.month}.${nowDate.year} ${nowDate.hours}.${nowDate.min}`;
        DelorianModel.findOne({remindTime: nowDate},(err, res) =>{
            if(err) return;
            try {
                if(!res.performed) {
                    console.log(res.performed);
                    ctx.telegram.sendMessage(res.chatId, res.text);
                    res.performed = true;
                    res.save((err)=>{
                        if (err) console.error(err);
                    })
                }
            } catch(e) {};
        });
    }, 1000);
};
const respectMongoListener = function(ctx) {
    let thisChatId = ctx.chat.id;                          // данные при текущем нажатии на кнопку
    let thisMessId = ctx.callbackQuery.message.message_id;
    let rate = ctx.callbackQuery.data; // Данные кнопки
    if(rate == 'like' || rate == 'dislike') {
        RespectModel.findOne({chatId: thisChatId, messageId: thisMessId},(err, res) =>{
            if (err || res === null) {console.log(err); return;}
            res[rate]++;
            ctx.telegram.editMessageText(res.chatId, res.messageId, null, res.text, Markup.inlineKeyboard([
                Markup.callbackButton(`👍 ${res.like}`, 'like'),
                Markup.callbackButton(`👎 ${res.dislike}`, 'dislike')
            ]).extra())
                .catch(err =>{
                    if (err.on.payload.text === res.text) { // если сообщение не изменялось
                        console.log('Текс не изменялся');
                    }
                })
            res.save((err)=>{
                if (err) console.error(err);
            });
        })
        .catch();
            
    }
    
};
const articleMongoListener = function(reqResourse, parser) {
    if (reqResourse) {
        const azaza = new Promise( (resolve, rej) => {
            ArticleModel.findOne({resourse: reqResourse}, (err, res) => {
                if(err) {console.log(err); return;};
                if (res) {
                    resolve(res.data)
                } else {
                    parser()
                        .then( result => {
                            let newRes = new ArticleModel({
                                resourse: reqResourse,
                                data: result,
                                funcName: parser.name,
                                date: new Date()
                            });
                            newRes.save((err)=>{
                                if (err) console.error(err);
                                resolve();
                            })
                            
                        })
                        .catch(err => {
                            rej(err);
                        })         
                }
            });
        });
        return new Promise((resolve, rej) => {
            azaza.then(() => {
                ArticleModel.findOne({resourse: reqResourse}, (err, res) => {
                    resolve(res.data)
                });
            })
            .catch(err => {
                rej(err);
            }); 
        })

    };

    setInterval( () => {    //нам нужно парсить раз в час, и записывать в БД
        ArticleModel.find((err, res) =>{
            if(err) return;
            for (item of res) {;
                let resourse = item.resourse;
                let funcName = item.funcName
                console.log(`Начинаю парсить "${resourse.toUpperCase()}"`);
                new Promise( (resolve, reject) => {
                    const newItem = item;   // замыкание для асинхронной функции
                    articleParser[funcName]()
                    .then( result => {
                        newItem.data = result;
                        newItem.date = new Date();
                        newItem.save((err)=>{
                            if (err) console.error(err);
                            resolve();
                        })
                    })
                
                })
                
            }
        });
    }, 1000 * 60 * 60 * (Math.floor(Math.random() * (2)) + 1)) // Парсим раз в час/два 

}
const userMongoListener = function(ctx, params) {
    return new Promise ((resolve, rej) => {
        if ( !ctx.from ) rej( `В ${ctx.chat.title} сохранение пользователей в ДБ не доступно` );
        UserModel.findOne({userId: ctx.from.id}, (err, res) =>{
            if (err) {console.log(err); return;}
            if (res) {resolve(res)};
            if (res === null) {
                const newUser = new UserModel({
                    firstName: ctx.from.first_name,
                    userName: ctx.from.username || ctx.from.first_name,
                    userId: ctx.from.id,
                    isBot: ctx.from.is_bot,
                    lang: ctx.from.language_code,
                });
                newUser.save((err, savedUser)=>{
                    if (err) console.error(err);
                    resolve(`Добавлен новый пользователь ${savedUser.userName}`);
                })
            }
        })
    });
}
const postmeMongoListener = function(ctx, params) {

    if (params.getMsgTypes) {
        return new Promise( (resolve, rej) => {
            ChatModel.findOne({chatID: ctx.chat.id}, (err, res) =>{
                if (err || res === null) {console.log(err || 'error'); return};
                switch(params.getMsgTypes) {
                    case 'current':
                        resolve(res.postme.mediaTypes);
                        return;
                    case 'all':
                        res.postme.mediaTypes.links = false;
                        res.postme.mediaTypes.video = false;
                        res.postme.mediaTypes.photo = false;
                        res.postme.mediaTypes.audio = false;
                        res.postme.mediaTypes.all = !res.postme.mediaTypes.all; 
                        break;
                    case 'photo':
                        res.postme.mediaTypes.all = false; 
                        res.postme.mediaTypes.photo = !res.postme.mediaTypes.photo; 
                        break;
                    case 'video':
                        res.postme.mediaTypes.all = false; 
                        res.postme.mediaTypes.video = !res.postme.mediaTypes.video; 
                        break;
                    case 'links':
                        res.postme.mediaTypes.all = false; 
                        res.postme.mediaTypes.links = !res.postme.mediaTypes.links; 
                        break;
                    case 'audio':
                        res.postme.mediaTypes.all = false; 
                        res.postme.mediaTypes.audio = !res.postme.mediaTypes.audio; 
                        break;
                };
                res.save((err, savedRes)=> {
                    if (err) {console.log(err); return};
                    resolve(savedRes.postme.mediaTypes);
                });
            });
        });
    };

    if (params.getPost) {
        return new Promise( (resolve, rej) => {
            if(params.getPost === 'sendPost') {
                ChatModel.findOne({chatID: ctx.chat.id}, (err, res) =>{
                    if (err || res === null) {console.log(err || 'error'); return};
                    if (res.postme.listening === 0) {
                        resolve('Сначала веберите источник. <b>Введите</b> <code>/postme options</code>')
                    } else {
                        ChatModel.findOne({chatID: res.postme.listening}, (err, res) =>{
                            if (err) {console.log(err); return};
                            resolve(res.postme.content);
                        });
                    }
                });
            }
            if (params.getPost === 'getMediatypes') {
                ChatModel.findOne({chatID: ctx.chat.id}, (err, res) =>{
                    if (err || res === null) {console.log(err || 'error'); return};
                    resolve(res.postme.mediaTypes);
                });
            };
        });
    }

    if (params.listening) {
        return new Promise( (resolve, rej) => {
            ChatModel.findOne({chatID: ctx.chat.id}, (err, res) =>{ // меняем ресурс на новый
                if (err) {console.log(err); return};
                const oldestResource = res.postme.listening;
                res.postme.listening = params.listening;
                res.save((err)=> {
                    if (err) {console.log(err); return};
                });

                ChatModel.findOne({chatID: oldestResource}, (err, resp) =>{ // уберем из списка слушателей старый ресурс
                    if (err) {console.log(err); return};
                    if (oldestResource !== 0) { // старый ресурс будет 0 если до этого он ничего не слушал
                        resp.postme.listeners = resp.postme.listeners.filter( item => {
                            return item !== ctx.chat.id;
                        });
                        resp.save( (err)=> {
                            if (err) {console.log(err); return};
                        });
                    };
                });

                ChatModel.findOne({chatID: params.listening}, (err, resp) =>{ // добавим в список слушателей новый ресурс
                    if (err) {console.log(err); return};
                    resp.postme.listeners.push(ctx.chat.id);
                    resp.save( (err)=> {
                        if (err) {console.log(err); return};
                        resolve(`Ресурс \"${resp.title || resp.username}\" успешно выбран!`)
                    });
                });
            });
            
            
        });
        
    }

    if (params.selected) {
        return new Promise( (resolve, rej) => {
            ChatModel.find({"postme.resourseActive": true}, (err, res) =>{
                if (err) {console.log(err); return};
                if (res === null || res.length === 0) {
                    resolve(false);
                } else {
                    resolve(res);
                };
            });
        });
        
    };

    if (params.adding) {
        return new Promise( (resolve, rej) => {
            ChatModel.findOne({chatID: ctx.chat.id}, async (err, res) =>{ // "postme.resourseActive": false}
                if (err) {console.log(err); return};
                if (params.privateProblem) {
                    res.postme.resourseActive = false;
                    res.markModified('postme');
                    res.save((err, data)=>{
                        if (err) console.error(err);
                        resolve(`Данная группа приватная, для добавления её в базу, добавьте к себе пользователя ${process.env.NAME_SHEN_VISOR}`);
                    });
                    return;
                }
                if (res.postme.resourseActive === true) {
                    resolve(`Чат уже в базе данных`);
                    return;
                };
                const userbotInGroup = await ctx.telegram.getChatMember(ctx.chat.id, process.env.SHEN_VISOR);
                if ( res.private === true && (userbotInGroup.status === "left" || userbotInGroup.status === "kicked") ) {
                    resolve(`Данная группа приватная, для добавления её в базу, добавьте к себе пользователя ${process.env.NAME_SHEN_VISOR}`);
                    return;
                };
                res.postme.resourseActive = true;
                ctx.telegram.sendMessage(process.env.SHEN_VISOR, `@scrapChat={"chatID":${res.chatID}, "maxMsgId":${res.maxMsgId}}`)
                res.save((err)=>{
                    if (err) console.error(err);
                    resolve('Чат добавлен в базу данных');
                });
            });
        
        });
    };

    if (params.delete) {
        return new Promise ( (resolve, rej) => {
            ChatModel.find((err, res) =>{
                if (err) {console.log(err); return};
                res.forEach( item => {
                    if (item.postme.listening === ctx.chat.id){ 
                        item.postme.listening = 0;
                    };
                    item.save();
                });
            });

            ChatModel.findOne( {chatID: ctx.chat.id}, (err, res) =>{
                if (err) {console.log(err); return};
                res.postme.listeners = [];
                res.save();
            });

            ChatModel.findOne({chatID: ctx.chat.id}, (err, res) =>{
                if (err) {console.log(err); return};
                if (res.postme.resourseActive === false) {resolve(false); return};
                res.postme.resourseActive = false;
                res.postme.content = {};
                res.save(err => {
                    if (err) {console.log(err); return};
                    resolve(true);
                });
            });
        });
    };
};

const addChatMongoListener = function(chat, ctx) {
    return new Promise( (resolve, rej) => {
        ChatModel.findOne({chatID: chat.id}, async (err, res) =>{
            if (err) {console.log(err); return};
            let privateOrNot = await ctx.getChat();
            privateOrNot = privateOrNot.username ? false : true;
            if (res === null) {
                const newChat = new ChatModel({
                    chatID: chat.id,
                    description: chat.description || 'Без описания',
                    photoLogo: chat.photo,
                    title: chat.title,
                    chatType: chat.type,
                    username: chat.username || 'Без имени',
                    maxMsgId: returnMsgId(ctx),
                    private: privateOrNot,
                    listening: [],   
                });
                newChat.save((err, futureMessage)=>{
                    if (err) console.error(err);
                    resolve(`${chat.type} ${chat.title || chat.username} успешно добавлен в базу`);
                });
            };
            if (res) {
                res.description = chat.description || 'Без описания';
                res.photoLogo = chat.photo;
                res.title = chat.title;
                res.chatType = chat.type;
                res.username = chat.username || 'Без имени';
                res.private = privateOrNot;
                if (returnMsgId(ctx)) {
                    res.maxMsgId = returnMsgId(ctx);
                };
                try {
                    addNewContent(ctx, res.postme.content);
                } catch (e) {
                    console.log(err)
                }
                res.markModified('postme.content');
                res.save((err, futureMessage)=>{
                    if (err) console.error(err);
                    resolve(`${chat.type} ${chat.title || chat.username} успешно обновлен`);
                });
            }
        });
    });
    
    
}

function returnMsgId(ctx) {
    const msgChannel = ctx.message ? ctx.message.message_id : false;
    const msgGroup = ctx.channelPost ? ctx.channelPost.message_id : false;
    return msgGroup || msgChannel
};
function addNewContent(ctx, db) { /* content, messageId, allContent */
    if (ctx.callbackQuery) return; // С нажатых кнопок обнволения собирать не будем
    const message = ctx.channelPost ? ctx.channelPost : ctx.message;
    if (message.photo) {
        handlerMessages.messagePhoto(message, message.message_id, db);
        return
    };
    if (message.animation) {
        handlerMessages.messageAnimation(message, message.message_id, db);
        return
    }
    if (message.text) {
        handlerMessages.messageText(message, message.message_id, db);
        return
    }
    if (message.video) {
        handlerMessages.messageVideo(message, message.message_id, db);
        return
    }
    if (message.video_note) {
        handlerMessages.messageVideoNote(message, message.message_id, db);
        return
    }
    if (message.voice) {
        handlerMessages.messageVoiceNote(message, message.message_id, db);
        return
    }
    if (message.audio) {
        handlerMessages.messageAudio(message, message.message_id, db);
        return
    }
    
}

module.exports = {
    dlMongoListener,
    respectMongoListener,
    articleMongoListener,
    userMongoListener,
    postmeMongoListener,
    addChatMongoListener
};