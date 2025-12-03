export const formatDate = (dateString: string): string => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-");
  return `${parseInt(day)}-${parseInt(month)}-${year}`;
};

export const reverseDate = (dateTimeString: string): string => {
  if (!dateTimeString) return "";
  // Tách phần ngày từ chuỗi thời gian
  const datePart = dateTimeString.split(" ")[0];
  // Tách năm, tháng, ngày từ phần ngày
  const [year, month, day] = datePart.split("-");
  // Trả về định dạng MM-DD-YYYY
  return `${month}-${day}-${year}`;
};
