export const nextPayment = (interval, dateISO) => {
  if (interval === "monthly") {
    const date = new Date(dateISO);

    const targetMonth = date.getMonth() + 1;

    const maxDay = new Date(date.getFullYear(), targetMonth + 1, 0).getDate();

    const finalDay = Math.min(date.getDate(), maxDay);

    return new Date(date.getFullYear(), targetMonth, finalDay);
  } else {
    const date = new Date(dateISO);

    const targetDate = date.getDate();
    const targetMonth = date.getMonth() + 1;

    return new Date(date.getFullYear() + 1, targetMonth, targetDate);
  }
};
