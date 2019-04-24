const mongoose = require('mongoose');

const delorianSchema = new mongoose.Schema({
    chatId: Number,
    userId: Number,
    messageId: Number,
    remindTime: String,
    text: String,
    performed: Boolean
});

delorianSchema.methods.speak = function() {
    console.log(Object.keys(this));
};

const DelorianModel = mongoose.model('DelorianModel', delorianSchema);

module.exports = {DelorianModel,};