import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';

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

const detectCode = (canvasElement: HTMLCanvasElement, fps: number): void => {
  const ctx = canvasElement.getContext('2d');
  if (ctx) {
    const image = ctx.getImageData(
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    const code = jsQR(image.data, image.width, image.height);
    if (code) {
      console.info(code);
    }
  }
  setTimeout(() => detectCode(canvasElement, fps), 1000 / fps);
};

function Canvas(props: {
  stream: MediaStream;
  videoElement: HTMLVideoElement;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracks = props.stream.getTracks();
  const [currentTrackIndex, updateCurrentTrackIndex] = useState<number>(0);
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width =
        tracks[currentTrackIndex]?.getSettings()?.width ?? 100;
      canvasRef.current.height =
        tracks[currentTrackIndex]?.getSettings()?.height ?? 100;
      const canvasContext = canvasRef.current.getContext('2d');
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
          tracks[currentTrackIndex].getSettings()?.frameRate ?? 30
        );
      }
    }
  });

  return (
    <>
      <div>
        <label htmlFor="selectCamera">カメラを選択</label>
        <select
          name="camera"
          id="selectCamera"
          onChange={(e) => {
            updateCurrentTrackIndex(Number(e.target.value));
          }}>
          {tracks.map((track, index) => (
            <option key={track.id} id={index.toString()}>
              {track.label}
            </option>
          ))}
        </select>
      </div>
      <canvas ref={canvasRef} />
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
      <p>QRコードを読み取ってください</p>
      <video playsInline muted autoPlay ref={videoRef} />
      {mediaStream && mediaStream?.active && videoRef.current && (
        <Canvas stream={mediaStream} videoElement={videoRef.current} />
      )}
      {error && <span>{error}</span>}
    </>
  );
}
