import React, { useEffect, useRef } from 'react';
import { dataWithId } from '../utils/firebase';
import { Group, Member } from '../utils/group';

export const Card: React.FC<{ member: dataWithId<Member>; group: Group }> = ({
  member,
  group,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLImageElement>(null);
  const width = 91;
  const height = 55;
  const name = member.data.name.toUpperCase().replace('　', ' ');
  const groupName = group.name.toUpperCase().replace('　', ' ');
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const yMargin = canvasWidth * 0.07;
      const xMargin = canvasHeight * 0.07; // 単位はpx
      ctx?.strokeRect(0, 0, canvasWidth, canvasHeight);
      if (ctx) {
        const defaultNameWidth = ctx.measureText(name).width;
        const defaultGroupNameWidth = ctx.measureText(groupName).width;
        ctx.font = `bold ${
          ((canvasWidth * 0.5) / defaultNameWidth) * 10
        }px 'Avenir','Helvetica Neue','Helvetica','Arial','Hiragino Sans','ヒラギノ角ゴシック',YuGothic,'Yu Gothic','メイリオ', Meiryo,'ＭＳ Ｐゴシック','MS PGothic',sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText(
          name,
          canvasWidth - yMargin,
          canvasHeight * 0.49,
          canvasWidth - yMargin
        );
        const measuredName = ctx.measureText(name);
        ctx.font = `${
          ((canvasWidth * 0.5) / defaultGroupNameWidth) * 5
        }px 'Avenir','Helvetica Neue','Helvetica','Arial','Hiragino Sans','ヒラギノ角ゴシック',YuGothic,'Yu Gothic','メイリオ', Meiryo,'ＭＳ Ｐゴシック','MS PGothic',sans-serif`;
        ctx.fillText(
          groupName,
          canvasWidth - yMargin,
          canvasHeight * 0.47 -
            (measuredName.actualBoundingBoxAscent +
              measuredName.actualBoundingBoxDescent),
          canvasWidth - yMargin
        );
        import('qrcode')
          .then((QRCode) => {
            QRCode.toDataURL(member.id, {
              width: canvasWidth,
            }).then((url) => {
              if (qrRef.current) {
                qrRef.current.src = url;
                setTimeout(() => {
                  if (qrRef.current) {
                    ctx.drawImage(
                      qrRef.current,
                      xMargin,
                      yMargin + 10,
                      canvasWidth / 2 - 2 * xMargin,
                      canvasWidth / 2 - 2 * xMargin
                    );
                  }
                }, 1000);
              }
            });
          })
          .catch((e) => console.error(e));
      }
    }
  }, [groupName, member.id, name]);
  return (
    <>
      <img alt="qrコード" ref={qrRef} />
      <canvas
        ref={canvasRef}
        width={width * 16}
        height={height * 16}
        style={{
          width: '91mm',
          height: '55mm',
          border: '1px solid black',
        }}
      />
    </>
  );
};
