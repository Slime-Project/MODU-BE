const checkFileExt = (file: Express.Multer.File, allowedExt: RegExp) => {
  return allowedExt.test(file.originalname.toLowerCase());
};

export { checkFileExt };
