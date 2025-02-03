const calculateTotalPages = (totalItems: number, pageSize: number) => {
  return Math.ceil(totalItems / pageSize);
};

const calculateSkip = (page: number, pageSize: number) => {
  return (page - 1) * pageSize;
};

const calculateHasMore = (totalItems: number, page: number, pageSize: number): boolean => {
  return totalItems - page * pageSize > 0;
};
export { calculateTotalPages, calculateSkip, calculateHasMore };
