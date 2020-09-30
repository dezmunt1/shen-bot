const Router = require('telegraf/router');
const {respectMongoListener} = require('./utils/mongoDB/mongoListener');
const {setSource, delSource, selectSource, selectedSource, replys, typeSource} = require('./handlers/postme')

const callbackQuerys = new Router((ctx) => {
    if (!ctx.callbackQuery.data) return;
    const cbData = ctx.callbackQuery.data.split(':');
    return {
        route: cbData[0],
        state: {
            cbParams: cbData[1]
        }
    }
});
;

// DELORIAN

callbackQuerys.on('sendFuture', (ctx) => {
    try {
        if ( !ctx.session.delorian ) {
            ctx.answerCbQuery('Этот опрос не актуален, введите /delorian еще раз', false);
            return ctx.deleteMessage(ctx.callbackQuery.message.message_id)
        }
        ctx.scene.enter('sendFuture');
        console.log('Вход в сцену sendFuture');
    } catch(e) { // если нажата кнопка при незапущенной сцене (не найдет зарегистрированной сцены)
        ctx.answerCbQuery('Этот опрос не актуален, введите /delorian еще раз', false);
    };
});

callbackQuerys.on('exitScene', (ctx) => {
    ctx.deleteMessage(ctx.callbackQuery.message.message_id)
    ctx.answerCbQuery('Ну и не надо', false)
    ctx.scene.leave()
    console.log('Выход из сцены')
});

// RESPEKT

callbackQuerys.on('like', (ctx) => {
    respectMongoListener(ctx);
    ctx.answerCbQuery('Заебись', false);
});

callbackQuerys.on('dislike', (ctx) => {
    respectMongoListener(ctx);
    ctx.answerCbQuery('Говно', false);
});

// POSTME

callbackQuerys.on('selectSource', (ctx) => {
    try {
        return selectSource(ctx);
    } catch(e) { 
        ctx.answerCbQuery('Этот опрос не актуален', false);
    };
});

callbackQuerys.on('selectedSource', (ctx) => {
    try {
        const resource = ctx.state.cbParams
        ctx.scene.enter()
    } catch(e) { // если нажата кнопка при незапущенной сцене (не найдет зарегистрированной сцены)
        ctx.answerCbQuery('Этот опрос не актуален', false);
    };
});

callbackQuerys.on('setSource', async (ctx) => {
  try {
    if (ctx.chat.type !== 'private' && ctx.chat.username) { // публичная группа
      return setSource(ctx)
    }
    if (ctx.chat.type !== 'private' && !ctx.chat.username) { // частная группа
      return setSource(ctx, {problem: 'chatType'})
    }
    return setSource(ctx, {problem: 'private'});
  } catch(error) { 
    console.error( error )
  }
})

callbackQuerys.on('getSource', (ctx) => {
    try {
        const resource = ctx.state.cbParams;
        replys(ctx, resource);
    } catch(e) { // если нажата кнопка при незапущенной сцене (не найдет зарегистрированной сцены)
        ctx.answerCbQuery('Этот опрос не актуален', false);
    };
});
callbackQuerys.on('typeSource', (ctx) => {
    try {
        const msgType = ctx.state.cbParams;
        typeSource(ctx, msgType);
    } catch(e) { // если нажата кнопка при незапущенной сцене (не найдет зарегистрированной сцены)
        ctx.answerCbQuery('Этот опрос не актуален', false);
    };
})

callbackQuerys.on('delSource', (ctx) => {
    try {
        delSource(ctx);
    } catch(e) { // если нажата кнопка при незапущенной сцене (не найдет зарегистрированной сцены)
        ctx.answerCbQuery('Этот опрос не актуален', false);
    };
})

callbackQuerys.on('replyMore', (ctx) => {
    return replys(ctx, 'contentMore');
})

callbackQuerys.on('deleteThisMsg', (ctx) => {
    try {
        ctx.deleteMessage(ctx.callbackQuery.message.message_id);
    } catch(e) { // если нажата кнопка при незапущенной сцене (не найдет зарегистрированной сцены)
        ctx.answerCbQuery('Этот опрос не актуален', false);
    };
})

callbackQuerys.on('postmeSetPassword', ctx => {
    const setPassword = ctx.state.cbParams
    if ( setPassword ) {
        // Доделываю логику с если пароля нет
    }
    
})


module.exports =  {
  callbackQuerys
}
