module.exports = (data, ctx) => {
    const {postmeMongoListener, } = require('../utils/mongoDB/mongoListener');
    const {errMessage, extra} = data;
    if (errMessage === 'CHANNEL_PRIVATE' && extra.chatId) {
        ctx.chat.id = +extra.chatId;
        postmeMongoListener(ctx, {adding: true, privateProblem: true})
            .then( data => {
                ctx.telegram.sendMessage(+extra.chatId, data);
            })
    }



}