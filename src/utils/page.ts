const calculateTotalPages = (totalItems: number, pageSize: number) => {
  return Math.ceil(totalItems / pageSize);
};

export { calculateTotalPages };
