

function correctTime(date) {
    // 22.11.1991 в 22.00
    let abc = date.split('в')
                .map(elem => {
                    return elem.split('.')
                });
    abc = abc[0].concat(abc[1]);

    let presentTime = new Date();
    let futureTime = new Date(abc[2], +abc[1]-1, abc[0], abc[3], abc[4]);
    if (futureTime < presentTime) {
        return false
    } else {
        return futureTime;
    }
}

const formatDate = (date) => {
    if(!date.getHours()) return false;
    const editedDate = {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        date: date.getDate(),
        hours: date.getMonth(),
        min: date.getMinutes(),
    }
    return editedDate;
}

module.exports = {
    correctTime,
    formatDate
}