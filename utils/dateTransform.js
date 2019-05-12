const moment = require('moment-timezone');

function correctTime(date, gmt) {
    // 22.11.1991 в 22.00
    let abc = date.split('в')
                .map(elem => {
                    return elem.split('.')
                });
    abc = abc[0].concat(abc[1]);

    let presentTime = new Date(); // UTC
    let futureTime = new Date(abc[2], +abc[1]-1, abc[0], abc[3], abc[4]) - (gmt * 3600000);
    futureTime = new Date(futureTime);
    console.log(`futureTime: ${futureTime}; presentTime:${presentTime}`);
    if (futureTime < presentTime) {
        return false
    } else {
        return futureTime;
    }
}

const formatDate = (date) => {
    const editedDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getHours(),
        min: date.getMinutes(),
    }
    return editedDate;
}

module.exports = {
    correctTime,
    formatDate
}