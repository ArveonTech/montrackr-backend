export const getMonthRange = () => {
  const dateNow = new Date();

  const year = dateNow.getFullYear();
  const month = dateNow.getMonth();

  const startDate = new Date(year, month, 1);

  const finalDay = new Date(year, month + 1, 0).getDate();

  const endDate = new Date(year, month, finalDay, 23, 59, 59, 999);

  return { startDate, endDate };
};
