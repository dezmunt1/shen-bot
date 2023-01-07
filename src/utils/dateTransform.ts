type DateTime = [
  { day: number; month: number; year: number },
  { hours: number; minutes: number },
];

// Date format - ДД.ММ.ГГГГ в ЧЧ.ММ
export const correctTime = (internalDate: string, gmt = 0) => {
  const [date, time] = internalDate.split('в');

  if (!date || !time) return false;

  const [day, month, year] = date.split('.').map((d) => +d);
  const [hours, minutes] = time.split('.').map((t) => +t);

  const presentTime = Date.now();
  const gmtNumber = process.env.NODE_ENV === 'production' ? gmt * 3600000 : 0;
  const futureTime =
    +new Date(year, month - 1, day, hours, minutes) - gmtNumber;
  if (futureTime < presentTime) {
    return false;
  }
  return futureTime;
};

export const formatDate = (date: Date) => {
  const editedDate = {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    date: date.getDate(),
    hours: date.getHours(),
    min: date.getMinutes(),
  };
  return editedDate;
};
