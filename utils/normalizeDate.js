const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export const normalizeDate = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const formatYearMonth = (yearMonth) => {
  const [year, month] = yearMonth.split("-");
  return `${months[Number(month) - 1]} ${year}`;
};

export const formatDate = (dateTime) => {
  const [year, month, date] = dateTime.toISOString().slice(0, 10).split("-");
  return `${date} ${months[Number(month) - 1]} ${year}`;
};
