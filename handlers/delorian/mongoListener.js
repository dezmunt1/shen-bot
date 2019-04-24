const {correctTime, formatDate} = require('../../utils/dateTransform');
const {DelorianModel} = require('../../models/schemas');

const dlMongoListener = function(ctx){
    setInterval(() => {
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

module.exports = {dlMongoListener,};