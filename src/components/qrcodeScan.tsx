import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AspectRatio,
  Circle,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Select,
  VStack,
} from '@chakra-ui/react';
import { cardHeight, cardWidth } from './createCard';
import { useContext } from 'react';
import { GroupContext } from '../contexts/group';
import { addWork, getMember } from '../utils/group';
import { firebase } from '../utils/firebase';

const getUserCamera = () =>
  new Promise<MediaStream>((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ video: true })
      .then((e) => {
        if (e) {
          resolve(e);
        } else {
          reject(false);
        }
      })
      .catch(() => {
        reject('カメラにアクセスできません');
      });
  });

const updateCanvas = (
  fps: number,
  ctx: CanvasRenderingContext2D,
  videoElement: HTMLVideoElement,
  width: number,
  height: number
): void => {
  ctx.drawImage(videoElement, 0, 0, width, height);
  setTimeout(() => {
    updateCanvas(fps, ctx, videoElement, width, height);
  }, fps / 1000);
};

const detectCode = (
  canvasElement: HTMLCanvasElement,
  fps: number,
  onDetectCode: (e: string) => Promise<boolean>
): void => {
  const ctx = canvasElement.getContext('2d');
  if (ctx) {
    const image = ctx.getImageData(
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    const code = jsQR(image.data, image.width, image.height);
    if (code && code.data) {
      onDetectCode(code.data).then((e) => {
        if (e) {
          setTimeout(
            () => detectCode(canvasElement, fps, onDetectCode),
            1000 / fps
          );
        }
      });
    } else {
      setTimeout(
        () => detectCode(canvasElement, fps, onDetectCode),
        1000 / fps
      );
    }
  }
};

function Canvas(props: {
  stream: MediaStream;
  videoElement: HTMLVideoElement;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracks = props.stream.getTracks();
  const [currentTrackIndex, updateCurrentTrackIndex] = useState<number>(0);
  const groupContext = useContext(GroupContext);
  const notificationAudio = useRef<HTMLAudioElement>(null);
  const errorAudio = useRef<HTMLAudioElement>(null);
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width =
        tracks[currentTrackIndex]?.getSettings()?.width ?? 100;
      canvasRef.current.height =
        tracks[currentTrackIndex]?.getSettings()?.height ?? 100;
      const canvasContext = canvasRef.current.getContext('2d');
      const unknownMemberIds: string[] = [];
      if (canvasContext) {
        updateCanvas(
          tracks[currentTrackIndex].getSettings()?.frameRate ?? 30,
          canvasContext,
          props.videoElement,
          canvasRef.current?.width,
          canvasRef.current?.height
        );
        detectCode(
          canvasRef.current,
          tracks[currentTrackIndex].getSettings()?.frameRate ?? 30,
          async (e): Promise<boolean> => {
            if (groupContext.currentId && !unknownMemberIds.includes(e)) {
              return getMember(e, groupContext.currentId).then((member) => {
                if (member && groupContext.currentId) {
                  addWork(groupContext.currentId, {
                    type: 'work',
                    content: {
                      startTime: firebase.firestore.Timestamp.now(),
                      endTime: null,
                      status: 'running',
                      memo: '',
                    },
                    memberId: e,
                  });
                  notificationAudio.current?.play();
                  return false;
                } else {
                  unknownMemberIds.push(e);
                  console.error('Unknown member');
                  errorAudio.current?.play();
                  return true;
                }
              });
            } else {
              console.error('Unknown member(saved)');
              errorAudio.current?.play();
              return true;
            }
          }
        );
      }
    }
  });

  return (
    <>
      <audio src="audio/notification_simple-01.wav" ref={notificationAudio} />
      <audio src="audio/alert_error-02.wav" ref={errorAudio} />
      <FormControl mt="2" mb="5">
        <HStack align="center">
          <FormLabel>カメラを選択</FormLabel>
          <Select
            w="max-content"
            onChange={(e) => {
              updateCurrentTrackIndex(Number(e.target.value));
            }}>
            {tracks.map((track, index) => (
              <option key={track.id} id={index.toString()}>
                {track.label}
              </option>
            ))}
          </Select>
        </HStack>
      </FormControl>
      <AspectRatio
        maxW="lg"
        maxH="lg"
        ratio={cardWidth / cardHeight}
        borderRadius="lg"
        overflow="hidden">
        <canvas ref={canvasRef} style={{ objectFit: 'cover' }} />
      </AspectRatio>
    </>
  );
}
export default function QRCodeScan(): JSX.Element {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, updateError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    getUserCamera()
      .then((e) => {
        setMediaStream(e);
        if (videoRef.current) {
          videoRef.current.srcObject = e;
        }
      })
      .catch((e) => {
        updateError(e);
      });
  }, []);
  return (
    <>
      <Heading>QRコードを読み取ってください</Heading>
      {mediaStream && mediaStream?.active && videoRef.current ? (
        <Canvas stream={mediaStream} videoElement={videoRef.current} />
      ) : (
        <Circle />
      )}
      <video
        playsInline
        muted
        autoPlay
        ref={videoRef}
        controlsList="nodownload nofullscreen noremoteplayback"
        disablePictureInPicture
        disableRemotePlayback
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          opacity: 0,
          zIndex: -10,
        }}
      />
      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>カメラにアクセスできません</AlertDescription>
        </Alert>
      )}
    </>
  );
}
