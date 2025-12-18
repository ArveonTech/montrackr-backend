export const yearToISO = (year) => {
  const startDate = new Date(year, 0, 1, 0, 0, 0, 0); // 1 Jan
  const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // 31 Des

  return {
    startDate,
    endDate,
  };
};
