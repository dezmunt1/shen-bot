const {correctTime, formatDate} = require('../../utils/dateTransform');
const Markup = require('telegraf/markup');
const {DelorianModel, RespectModel} = require('../../models/schemas');

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
            } catch {};
        });
    }, 1000);
};

const respectMongoListener = function(ctx) {
    console.log('zzzzzzz');
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

module.exports = {dlMongoListener, respectMongoListener};