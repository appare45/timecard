export const dateToJapaneseTime = ({
  timeObject,
  full = false,
}: {
  timeObject: Date | null;
  full?: boolean | undefined;
}): string => {
  const today = new Date();
  let text = '';
  if (timeObject) {
    if (timeObject.getFullYear() < today.getFullYear()) {
      text += `${timeObject.getFullYear()}年`;
    }
    text +=
      `00${timeObject.getMonth() + 1}`.slice(-2) +
      '/' +
      `00${timeObject.getDate()}`.slice(-2);
    if (full) {
      text +=
        ' ' +
        `00${timeObject.getHours()}`.slice(-2) +
        ':' +
        `00${timeObject.getMinutes()}`.slice(-2) +
        ':' +
        `00${timeObject.getSeconds()}`.slice(-2);
    }
  }
  return text;
};

export const relativeTimeText = (DateObject: Date | null): void | string => {
  if (DateObject) {
    const texts: string[] = [];
    const now = new Date();
    if (DateObject.getFullYear() != now.getFullYear()) {
      texts.push(`${DateObject.getFullYear()}年`);
    }
    if (
      DateObject.getMonth() != now.getMonth() ||
      DateObject.getDate() != now.getDate()
    ) {
      texts.push(`${DateObject.getMonth() + 1}月${DateObject.getDate()}日`);
    } else if (DateObject.getHours() != now.getHours()) {
      texts.push(`${now.getHours() - DateObject.getHours()}時間前`);
    } else if (DateObject.getMinutes() != now.getMinutes()) {
      texts.push(`${now.getMinutes() - DateObject.getMinutes()}分前`);
    } else {
      texts.push(`${now.getSeconds() - DateObject.getSeconds()}秒前`);
    }
    return texts.join();
  }
};

export const millisToText = (time: number): string => {
  let text = '';
  const _time = time / 100;
  if (_time / 60 / 60 / 60 > 1)
    text += `${Math.round(((_time % 60) % 60) % 60)}時間`;
  if (_time / 60 / 60 > 1) text += `${Math.round((_time % 60) % 60)}分`;
  if (_time / 60 > 1) text += `${Math.round(_time % 60)}秒`;
  return text;
};
