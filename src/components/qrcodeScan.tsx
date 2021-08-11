import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AspectRatio,
  Box,
  Button,
  Circle,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Select,
  Skeleton,
  useToast,
} from '@chakra-ui/react';
import { cardHeight, cardWidth } from './createCard';
import { useContext } from 'react';
import { GroupContext } from '../contexts/group';
import {
  activity,
  addWork,
  getLatestActivity,
  getMember,
  Member,
  setWork,
  work,
} from '../utils/group';
import { dataWithId, firebase } from '../utils/firebase';
import { ActivityCard } from './activity';

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
  onDetect: (e: dataWithId<Member>) => void;
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
                notificationAudio.current?.play();
                if (member && groupContext.currentId) {
                  props.onDetect({ id: e, data: member });
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
      {!tracks.length && (
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
      )}
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

const MemberAction: React.FC<{
  member: dataWithId<Member>;
  onClose: () => void;
}> = ({ member, onClose }) => {
  const [latestActivity, setLatestActivity] =
    useState<firebase.firestore.QueryDocumentSnapshot<activity<work>> | null>(
      null
    );
  const { currentId } = useContext(GroupContext);
  const toast = useToast();
  useEffect(() => {
    if (currentId) {
      getLatestActivity(currentId, member.id).then((activity) =>
        setLatestActivity(activity)
      );
    }
  }, [currentId, member.id]);
  return (
    <>
      <Box mb="5">
        {member.data.name ? (
          <Heading fontSize="2xl">
            {member.data.name}の最終アクティビティー
          </Heading>
        ) : (
          <Skeleton>
            <Heading fontSize="2xl">読み込み中</Heading>
          </Skeleton>
        )}
        {latestActivity?.data() ? (
          <ActivityCard data={latestActivity.data()} member={member.data} />
        ) : (
          <Skeleton h="28" w="60" />
        )}
      </Box>
      <HStack>
        <Button
          colorScheme={
            latestActivity?.data().content.status === 'running'
              ? 'red'
              : 'green'
          }
          onClick={() => {
            if (currentId && member) {
              if (latestActivity?.data().content.status === 'done') {
                addWork(currentId, {
                  type: 'work',
                  content: {
                    startTime: firebase.firestore.Timestamp.now(),
                    endTime: null,
                    status: 'running',
                    memo: '',
                  },
                  memberId: member.id,
                }).then(() => {
                  onClose();
                  toast({
                    title: '開始しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                });
              } else if (latestActivity?.id) {
                const _latestActivity = latestActivity.data();
                _latestActivity.content.endTime =
                  firebase.firestore.Timestamp.now();
                _latestActivity.content.status = 'done';
                setWork(currentId, latestActivity?.id, _latestActivity, {
                  merge: true,
                }).then(() => {
                  onClose();
                  toast({
                    title: '終了しました',
                    status: 'success',
                    duration: 3000,
                    isClosable: true,
                  });
                });
              }
            }
          }}>
          {latestActivity?.data().content.status === 'running'
            ? '終了'
            : '開始'}
        </Button>
        <Button variant="ghost" colorScheme="red" onClick={() => onClose()}>
          キャンセル
        </Button>
      </HStack>
    </>
  );
};

export default function QRCodeScan(props: {
  onClose: () => void;
}): JSX.Element {
  const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
  const [error, updateError] = useState('');
  const videoRef = useRef<HTMLVideoElement>(null);
  const [detectedMember, setDetectedMember] =
    useState<null | dataWithId<Member>>(null);

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
      {mediaStream &&
      mediaStream?.active &&
      videoRef.current &&
      !detectedMember ? (
        <>
          <Canvas
            stream={mediaStream}
            videoElement={videoRef.current}
            onDetect={(e) => setDetectedMember(e)}
          />
        </>
      ) : (
        <Circle />
      )}
      {detectedMember ? (
        <MemberAction
          member={detectedMember}
          onClose={() => {
            setDetectedMember(null);
            props.onClose();
          }}
        />
      ) : (
        <AspectRatio
          maxW="lg"
          maxH="lg"
          ratio={cardWidth / cardHeight}
          borderRadius="lg"
          bg="gray.400"
          overflow="hidden">
          <video
            playsInline
            muted
            autoPlay
            ref={videoRef}
            controlsList="nodownload nofullscreen noremoteplayback"
            disablePictureInPicture
            disableRemotePlayback
            style={{ objectFit: 'cover' }}
          />
        </AspectRatio>
      )}

      {error && (
        <Alert status="error">
          <AlertIcon />
          <AlertDescription>カメラにアクセスできません</AlertDescription>
        </Alert>
      )}
    </>
  );
}
