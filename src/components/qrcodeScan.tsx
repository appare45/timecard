import React, { Suspense, useEffect, useRef, useState } from 'react';
import {
  Alert,
  AlertDescription,
  AlertIcon,
  AspectRatio,
  Box,
  Button,
  ButtonGroup,
  Circle,
  Spinner,
} from '@chakra-ui/react';
import { dataWithId } from '../utils/firebase';
import { IoCamera } from 'react-icons/io5';
import { Member } from '../utils/member';
import { FullScreenSwitch } from './fullscreen';

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

// eslint-disable-next-line react/display-name
const QRCodeScan = React.memo(
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
      };
    }, [mediaStream]);

    useEffect(() => {
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    }, [mediaStream]);

    const Canvas = React.lazy(() => import('./qr-scan-canvas'));

    return (
      <>
        {error ? (
          <Alert status="error">
            <AlertIcon />
            <AlertDescription>カメラにアクセスできません</AlertDescription>
          </Alert>
        ) : (
          <Box pos="relative">
            {mediaStream && mediaStream?.active && videoRef.current ? (
              <Suspense fallback={<Spinner />}>
                <Canvas
                  stream={mediaStream}
                  videoElement={videoRef.current}
                  onDetect={(e) => props.onDetect(e)}
                />
              </Suspense>
            ) : (
              <Circle />
            )}
            <AspectRatio
              maxH="100vh"
              h="full"
              ratio={1}
              borderRadius="lg"
              bg="gray.400"
              overflow="hidden"
            >
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

            <ButtonGroup pos="absolute" top="5" left="5">
              <Button
                leftIcon={<IoCamera />}
                onClick={() => {
                  mediaStream?.getTracks().forEach((element) => {
                    element.stop();
                  });
                  setFacingMode(facingMode == 'user' ? 'environment' : 'user');
                }}
              >
                カメラ切り替え
              </Button>
              <FullScreenSwitch />
            </ButtonGroup>
          </Box>
        )}
      </>
    );
  }
);

export default QRCodeScan;
