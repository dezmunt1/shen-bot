const mongoose = require('mongoose');

const delorianSchema = new mongoose.Schema({
    chatId: Number,
    userId: Number,
    messageId: Number,
    remindTime: String,
    text: String,
    performed: Boolean
});

module.exports = {delorianSchema,};