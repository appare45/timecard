export const dateToJapaneseTime = (timeObject: Date | null): string => {
  const today = new Date();
  let text = '';
  if (timeObject) {
    if (timeObject.getFullYear() < today.getFullYear()) {
      text += `${timeObject.getFullYear()}年`;
    }
    text += `${timeObject.getMonth()}/${timeObject.getMonth() + 1}`;
  }
  return text;
};
