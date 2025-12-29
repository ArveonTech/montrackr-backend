export const dayToISO = () => {
  const dateNow = new Date();

  const year = dateNow.getFullYear();
  const month = dateNow.getMonth();
  const day = dateNow.getDate();

  const startDay = new Date(year, month, day);
  const endDay = new Date(year, month, day, 23, 59, 59, 999);

  return { startDay, endDay };
};
