const moment = require('moment-timezone')

function correctTime(date, gmt) {
  const transformDate = date
    .split('в')
    .map( (elem, i) => {
      const spl = elem.split('.')
      if (  i === 0  && spl.length === 3 ) {
        return { day: +spl[0], month: +spl[1], year: +spl[2] }
      }
      return { hours: +spl[0], minutes: +spl[1] }
    })

  const { day, month, year, hours, minutes } = { ...transformDate[0], ...transformDate[1] }

  const presentTime = new Date()
  const gmtNumber = process.env.NODE_ENV === 'production' ? (gmt * 3600000) : 0
  let futureTime = new Date( year, month-1, day, hours, minutes) - gmtNumber
  if (futureTime < presentTime) {
    return false
  } else {
    return futureTime
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
  return editedDate
}

module.exports = {
    correctTime,
    formatDate
}
