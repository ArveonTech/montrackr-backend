export const monthYearToISO = (month, year) => {
  // start: awal bulan
  const startDate = new Date(year, month - 1, 1, 0, 0, 0, 0);

  const endDate = new Date(year, month, 0, 23, 59, 59, 999);

  return {
    startDate,
    endDate,
  };
};
