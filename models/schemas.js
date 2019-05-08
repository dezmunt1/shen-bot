const mongoose = require('mongoose');

const delorianSchema = new mongoose.Schema({
    chatId: Number,
    userId: Number,
    messageId: Number,
    remindTime: String,
    text: String,
    performed: Boolean
});

const respectSchema = new mongoose.Schema({
    cbId: Number,
    chatId: String,
    userId: Number,
    messageId: Number,
    text: String,
    like: Number,
    dislike: Number
});

const articleSchema = new mongoose.Schema({
    resourse: String,
    data: Object,
    funcName: String,
    date: Date
});

const DelorianModel = mongoose.model('DelorianModel', delorianSchema);
const RespectModel = mongoose.model('RespectModel', respectSchema);
const ArticleModel = mongoose.model('ArticleModel', articleSchema);


module.exports = {DelorianModel, RespectModel, ArticleModel};