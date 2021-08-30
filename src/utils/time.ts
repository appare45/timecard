export const dateToJapaneseTime = (timeObject: Date | null): string => {
  const today = new Date();
  let text = '';
  if (timeObject) {
    if (timeObject.getFullYear() < today.getFullYear()) {
      text += `${timeObject.getFullYear()}年`;
    }
    text +=
      `00${timeObject.getMonth()}`.slice(-2) +
      '/' +
      `00${timeObject.getMonth() + 1}`.slice(-2);
  }
  return text;
};
