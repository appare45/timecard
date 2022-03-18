import { DocumentSnapshot } from '@firebase/firestore';
import { Box, AspectRatio, Link } from '@chakra-ui/layout';
import { IconButton } from '@chakra-ui/button';
import { Skeleton } from '@chakra-ui/skeleton';
import React, { useEffect, useRef, useState } from 'react';
import { IoDownloadOutline } from 'react-icons/io5';
import { useIsPrint } from '../hooks/media-query';
import { dataWithId } from '../utils/firebase';
import { Group } from '../utils/group';
import { Member } from '../utils/member';

export const cardWidth = 91;
export const cardHeight = 55;
const Card: React.FC<{
  member: dataWithId<Member>;
  group: DocumentSnapshot<Group>;
}> = ({ member, group }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLImageElement>(null);
  const name = member.data.name.toUpperCase().replace('　', ' ');
  const groupName = group.data()?.name.toUpperCase().replace('　', ' ');
  const [dataUrl, setDataUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isPrint = useIsPrint();
  useEffect(() => {
    if (canvasRef.current && groupName) {
      const ctx = canvasRef.current.getContext('2d');
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const yMargin = canvasHeight * 0.07;
      const xMargin = canvasHeight * 0.07; // 単位はpxx
      ctx?.strokeRect(0, 0, canvasWidth, canvasHeight);
      if (ctx) {
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight);
        ctx.fillStyle = 'black';
        ctx.fillRect(0, 0, canvasWidth, canvasHeight / 2);
        ctx.fillStyle = 'white';
        const defaultNameWidth = ctx.measureText(name).width;
        const defaultGroupNameWidth = ctx.measureText(groupName).width;
        ctx.font = `bold ${
          ((canvasWidth - canvasHeight / 2) / defaultNameWidth) * 9
        }px 'Avenir','Helvetica Neue','Helvetica','Arial','Hiragino Sans','ヒラギノ角ゴシック',YuGothic,'Yu Gothic','メイリオ', Meiryo,'ＭＳ Ｐゴシック','MS PGothic',sans-serif`;
        // ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText(
          name,
          canvasWidth - yMargin,
          canvasHeight * 0.4,
          canvasWidth - yMargin
        );
        ctx.fillStyle = 'black';
        const measuredName = ctx.measureText(name);
        ctx.font = `${
          ((canvasWidth * 0.5) / defaultGroupNameWidth) * 3
        }px 'Avenir','Helvetica Neue','Helvetica','Arial','Hiragino Sans','ヒラギノ角ゴシック',YuGothic,'Yu Gothic','メイリオ', Meiryo,'ＭＳ Ｐゴシック','MS PGothic',sans-serif`;
        ctx.fillText(
          groupName,
          canvasWidth - yMargin,
          canvasHeight * 0.5 +
            (measuredName.actualBoundingBoxAscent +
              measuredName.actualBoundingBoxDescent),
          canvasWidth - yMargin
        );
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(0, canvasHeight / 2.1);
        ctx.lineTo(canvasWidth, canvasHeight / 2.1);
        ctx.closePath();
        ctx.stroke();
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
                      canvasHeight / 2,
                      canvasHeight / 2 - xMargin,
                      canvasHeight / 2 - xMargin
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
    <Box pos="relative">
      <Box pos="fixed" top="0" left="0" zIndex="-10000" opacity="0">
        <img alt="qrコード" ref={qrRef} />
      </Box>
      {isLoading && (
        <Skeleton
          w={`${cardWidth}mm`}
          h={`${cardHeight}mm`}
          isLoaded={!isLoading}
        />
      )}
      <AspectRatio
        w={`${cardWidth}mm`}
        h={`${cardHeight}mm`}
        ratio={cardWidth / cardHeight}
        display={isLoading ? 'none' : 'block'}
        pos="relative"
      >
        <canvas
          ref={canvasRef}
          width={cardWidth * 16}
          height={cardHeight * 16}
          style={{
            border: '1px solid black',
          }}
        />
      </AspectRatio>
      {dataUrl && !isPrint && (
        <IconButton
          aria-label="カードをダウンロード"
          icon={<IoDownloadOutline />}
          href={dataUrl}
          variant="outline"
          as={Link}
          download
          pos="absolute"
          top="2"
          left="2"
        />
      )}
    </Box>
  );
};

export default Card;
