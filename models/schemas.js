const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    resourse: String,
    data: Object,
    funcName: String,
    date: Date
});

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

const userSchema = new mongoose.Schema({
    firstName: String,
    userName: String,
    userId: Number,
    gmt: {type: String, default: '3'}
});

const ArticleModel = mongoose.model('ArticleModel', articleSchema);
const DelorianModel = mongoose.model('DelorianModel', delorianSchema);
const RespectModel = mongoose.model('RespectModel', respectSchema);
const UserModel = mongoose.model('UserModel', userSchema);


module.exports = {DelorianModel, RespectModel, ArticleModel, UserModel};