const isValidCustomSeq = (seq: string): boolean => {
  const regex = new RegExp(/^[a-zA-Z0-9]+$/);
  return regex.test(seq);
};

export default isValidCustomSeq;
