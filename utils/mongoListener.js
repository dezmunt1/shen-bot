const {correctTime, formatDate} = require('./dateTransform');
const articleParser = require('../utils/articleParser');
const Markup = require('telegraf/markup');
const {DelorianModel, RespectModel, ArticleModel, UserModel} = require('../models/schemas');

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
    const reqDB = new Promise ((resolve, rej) => {
        UserModel.findOne({userId: ctx.from.id}, (err, res) =>{
            if (err) {console.log(err); return;}
            if (res) {resolve(res)};
            if (res === null) {
                const newUser = new UserModel({
                    firstName: ctx.from.first_name,
                    userName: ctx.from.username || ctx.from.first_name,
                    userId: ctx.from.id
                });
                newUser.save((err)=>{
                    if (err) console.error(err);
                    resolve();
                })
            }
        })
    });
    return new Promise( (resolve, rej) => {
        reqDB
            .then((resp) => {
                if (resp) {
                    resolve(resp)
                } else {
                    UserModel.findOne({userId: ctx.from.id}, (err, res) =>{
                        if (err) {console.log(err); return;}
                        resolve(res);
                    });
                };
            })
            .catch(err => {
            rej(err);
        }); 
    });
}

module.exports = {
    dlMongoListener,
    respectMongoListener,
    articleMongoListener,
    userMongoListener
};