const calculateTotalPages = (totalItems: number, pageSize: number) => {
  return Math.ceil(totalItems / pageSize);
};

const calculateSkip = (page: number, pageSize: number) => {
  return (page - 1) * pageSize;
};

export { calculateTotalPages, calculateSkip };
