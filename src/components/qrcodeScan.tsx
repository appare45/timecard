import React, {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';
import jsQR from 'jsqr';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AspectRatio,
  Box,
  Button,
  ButtonGroup,
  Circle,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Select,
  Skeleton,
  Textarea,
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
import { dataWithId } from '../utils/firebase';
import { MutableRefObject } from 'react';
import { IoCamera } from 'react-icons/io5';
import { useMemo } from 'react';
import { QueryDocumentSnapshot, Timestamp } from 'firebase/firestore';

const getUserCamera = (facingMode?: VideoFacingModeEnum) =>
  new Promise<MediaStream>((resolve, reject) => {
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: facingMode } })
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
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracks = props.stream.getTracks();
  const [currentTrackIndex, updateCurrentTrackIndex] = useState<number>(0);
  const groupContext = useContext(GroupContext);
  const notificationAudio = useRef<HTMLAudioElement>(null);
  const errorAudio = useRef<HTMLAudioElement>(null);
  const detectCode = useCallback(
    (
      canvasElement: HTMLCanvasElement,
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
          onDetectCode(code.data);
        }
      }
    },
    []
  );

  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width =
        tracks[currentTrackIndex]?.getSettings()?.width ?? 100;
      canvasRef.current.height =
        tracks[currentTrackIndex]?.getSettings()?.height ?? 100;
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
            if (groupContext.currentId && !unknownMemberIds.includes(e)) {
              return getMember(e, groupContext.currentId).then((member) => {
                const memberData = member?.data();
                if (memberData && groupContext.currentId) {
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
      }, tracks[currentTrackIndex].getSettings()?.frameRate ?? 30);

      return () => {
        clearInterval(interval);
      };
    }
  }, [currentTrackIndex, detectCode, groupContext.currentId, props, tracks]);

  return (
    <>
      <audio src="audio/notification_simple-01.wav" ref={notificationAudio} />
      <audio src="audio/alert_error-02.wav" ref={errorAudio} />
      {tracks.length > 1 && (
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

export const MemberAction: React.FC<{
  member: dataWithId<Member>;
  onClose: () => void;
  cancelRef?: MutableRefObject<null>;
}> = ({ member, onClose, cancelRef }) => {
  const [latestActivity, setLatestActivity] = useState<QueryDocumentSnapshot<
    activity<work>
  > | null>(null);
  const { currentId } = useContext(GroupContext);
  const toast = useToast();
  const [memo, setMemo] = useState('');
  const ActivityCard = React.lazy(() => import('./activity-card'));
  const LatestActivityCard = useMemo(() => {
    return latestActivity?.data() ? (
      <ActivityCard activitySnapshot={latestActivity} member={member.data} />
    ) : (
      <Skeleton h="28" w="60" />
    );
  }, [ActivityCard, latestActivity, member.data]);

  useMemo(() => {
    if (currentId) {
      getLatestActivity(currentId, member.id).then((activity) => {
        setLatestActivity(activity);
        if (activity.data().content.status == 'running') {
          setMemo(activity.data().content.memo);
        }
      });
    }
  }, [currentId, member.id]);
  return (
    <>
      <Box mb="5">
        {member.data.name ? (
          <Heading fontSize="2xl">前回のアクティビティー</Heading>
        ) : (
          <Skeleton>
            <Heading fontSize="2xl">読み込み中</Heading>
          </Skeleton>
        )}
        <Suspense fallback={<Skeleton />}>{LatestActivityCard}</Suspense>
      </Box>
      <FormControl>
        <FormLabel>メモ</FormLabel>
        <Textarea
          mb="5"
          placeholder="活動の記録（組織内に公開されます）"
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
        />
      </FormControl>
      <ButtonGroup>
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
                    startTime: Timestamp.now(),
                    endTime: null,
                    status: 'running',
                    memo: memo.replace(/\n/g, '\\n'),
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
                _latestActivity.content.endTime = Timestamp.now();
                _latestActivity.content.status = 'done';
                _latestActivity.content.memo = memo;
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
        <Button
          variant="ghost"
          colorScheme="red"
          onClick={() => onClose()}
          ref={cancelRef}>
          キャンセル
        </Button>
      </ButtonGroup>
    </>
  );
};

// eslint-disable-next-line react/display-name
export const QRCodeScan = React.memo(
  (props: { onDetect: (e: dataWithId<Member>) => void }): JSX.Element => {
    const [mediaStream, setMediaStream] = useState<MediaStream | null>(null);
    const [error, updateError] = useState('');
    const videoRef = useRef<HTMLVideoElement>(null);
    const [facingMode, setFacingMode] = useState<VideoFacingModeEnum>('user');

    useEffect(() => {
      getUserCamera(facingMode)
        .then((e) => {
          setMediaStream(e);
        })
        .catch((e) => {
          updateError(e);
        });
    }, [facingMode]);

    useEffect(() => {
      return () => {
        mediaStream?.getTracks().forEach((e) => e.stop());
        console.info('stopped');
      };
    }, [mediaStream]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    }, [mediaStream]);

    return (
      <Box pos="relative">
        {mediaStream && mediaStream?.active && videoRef.current ? (
          <>
            <Canvas
              stream={mediaStream}
              videoElement={videoRef.current}
              onDetect={(e) => props.onDetect(e)}
            />
          </>
        ) : (
          <Circle />
        )}
        <AspectRatio
          maxH="100vh"
          h="full"
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

        {error && (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>カメラにアクセスできません</AlertDescription>
          </Alert>
        )}
        <Button
          pos="absolute"
          top="5"
          left="5"
          leftIcon={<IoCamera />}
          onClick={() => {
            mediaStream?.getTracks().forEach((element) => {
              element.stop();
            });
            setFacingMode(facingMode == 'user' ? 'environment' : 'user');
          }}>
          カメラ切り替え
        </Button>
      </Box>
    );
  }
);

export default QRCodeScan;
