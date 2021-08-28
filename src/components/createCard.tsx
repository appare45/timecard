import { AspectRatio, Box, Button, Link, Skeleton } from '@chakra-ui/react';
import React, { useEffect, useRef, useState } from 'react';
import { IoDownload } from 'react-icons/io5';
import { dataWithId } from '../utils/firebase';
import { Group, Member } from '../utils/group';

export const cardWidth = 91;
export const cardHeight = 55;
export const Card: React.FC<{ member: dataWithId<Member>; group: Group }> = ({
  member,
  group,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLImageElement>(null);
  const name = member.data.name.toUpperCase().replace('　', ' ');
  const groupName = group.name.toUpperCase().replace('　', ' ');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const yMargin = canvasWidth * 0.07;
      const xMargin = canvasHeight * 0.07; // 単位はpx
      ctx?.strokeRect(0, 0, canvasWidth, canvasHeight);
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'black';
        const defaultNameWidth = ctx.measureText(name).width;
        const defaultGroupNameWidth = ctx.measureText(groupName).width;
        ctx.font = `bold ${
          ((canvasWidth * 0.5) / defaultNameWidth) * 9
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
          ((canvasWidth * 0.5) / defaultGroupNameWidth) * 3
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
                  setIsLoading(false);
                  setDataUrl(canvasRef.current?.toDataURL() ?? null);
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
      <Box pos="fixed" top="0" left="0" zIndex="-1" opacity="0">
        <img alt="qrコード" ref={qrRef} />
      </Box>
      {isLoading && (
        <Skeleton
          w={`${cardWidth * 4}`}
          h={`${cardHeight * 4}`}
          isLoaded={!isLoading}
        />
      )}
      <AspectRatio
        w="sm"
        ratio={cardWidth / cardHeight}
        display={isLoading ? 'none' : 'block'}>
        <canvas
          ref={canvasRef}
          width={cardWidth * 16}
          height={cardHeight * 16}
          style={{
            border: '1px solid black',
          }}
        />
      </AspectRatio>
      {dataUrl && (
        <Link href={dataUrl} download>
          <Button leftIcon={<IoDownload />}>ダウンロード</Button>
        </Link>
      )}
    </>
  );
};
