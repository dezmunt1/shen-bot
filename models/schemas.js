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
    isBot: Boolean,
    lang: {type: String, default: 'en'},
    gmt: {type: String, default: '+3'}
});

const chatSchema = new mongoose.Schema({
    chatID: Number,
    description: {type: String, default: 'Без описания'},
    photoLogo: Object,
    title: String,
    chatType: String,
    username: String,
    maxMsgId: Number,
    private: Boolean,
    postme: {
        mediaTypes: {
            links: {type: Boolean, default: false},
            photo: {type: Boolean, default: false},
            video: {type: Boolean, default: false},
            audio: {type: Boolean, default: false},
            all: {type: Boolean, default: true}
        },
        content: {
            links: {type: Object, default: {}},
            photo: {type: Object, default: {}},
            animation: {type: Object, default: {}},
            video: {type: Object, default: {}},
            audio: {type: Object, default: {}},
            voicenote: {type: Object, default: {}},
            videonote: {type: Object, default: {}},
        },
        resourseActive: {type: Boolean, default: false},
        listening: {type: Number, default: 0},
        listeners: {type: Array, default: []}
    },    
});


const ArticleModel = mongoose.model('ArticleModel', articleSchema);
const ChatModel = mongoose.model('ChatModel', chatSchema);
const DelorianModel = mongoose.model('DelorianModel', delorianSchema);
const RespectModel = mongoose.model('RespectModel', respectSchema);
const UserModel = mongoose.model('UserModel', userSchema);


module.exports = {DelorianModel, RespectModel, ArticleModel, UserModel, ChatModel};