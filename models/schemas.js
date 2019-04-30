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

const DelorianModel = mongoose.model('DelorianModel', delorianSchema);
const RespectModel = mongoose.model('RespectModel', respectSchema);

module.exports = {DelorianModel, RespectModel};