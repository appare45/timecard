import React, { useRef, useContext, useCallback, useEffect } from 'react';
import { GroupContext } from '../contexts/group';
import { dataWithId } from '../utils/firebase';
import { Member, getMember } from '../utils/member';

const updateCanvas = (
  ctx: CanvasRenderingContext2D,
  videoElement: HTMLVideoElement,
  width: number,
  height: number
): void => {
  ctx.drawImage(videoElement, 0, 0, width, height);
};

function Canvas(props: {
  stream: MediaStream;
  videoElement: HTMLVideoElement;
  onDetect: (e: dataWithId<Member>) => void;
}): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracks = props.stream.getTracks();
  const { currentGroup } = useContext(GroupContext);
  const errorAudio = useRef<HTMLAudioElement>(null);
  const jsQR = import('jsqr');
  const detectCode = useCallback(
    async (
      canvasElement: HTMLCanvasElement,
      onDetectCode: (e: string) => Promise<boolean>
    ): Promise<void> => {
      const ctx = canvasElement.getContext('2d');
      if (ctx) {
        const image = ctx.getImageData(
          0,
          0,
          canvasElement.width,
          canvasElement.height
        );
        const code = (await jsQR).default(
          image.data,
          image.width,
          image.height
        );
        if (code && code.data) {
          onDetectCode(code.data);
        }
      }
    },
    [jsQR]
  );

  useEffect(() => {
    if (canvasRef.current) {
      const canvasContext = canvasRef.current.getContext('2d');
      const unknownMemberIds: string[] = [];
      const interval = setInterval(() => {
        if (canvasContext && canvasRef.current) {
          updateCanvas(
            canvasContext,
            props.videoElement,
            canvasRef.current?.width,
            canvasRef.current?.height
          );
          detectCode(canvasRef.current, async (e): Promise<boolean> => {
            if (currentGroup && !unknownMemberIds.includes(e)) {
              return getMember(e, currentGroup.id).then((member) => {
                const memberData = member?.data();
                if (memberData) {
                  props.onDetect({ id: e, data: memberData });
                  return false;
                } else {
                  unknownMemberIds.push(e);
                  console.error('Unknown member');
                  return true;
                }
              });
            } else {
              console.error('Unknown member(saved)');
              return true;
            }
          });
        }
      }, 30);

      return () => {
        clearInterval(interval);
      };
    }
  }, [currentGroup, detectCode, props, tracks]);

  return (
    <>
      <audio src="audio/alert_error-02.wav" ref={errorAudio} />
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          opacity: 0,
          zIndex: -10,
        }}
      />
    </>
  );
}
export default Canvas;
