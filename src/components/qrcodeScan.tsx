import React, { useEffect, useMemo, useRef, useState } from 'react';
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
function Canvas(props: {
  stream: MediaStream;
  videoElement: HTMLVideoElement;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tracks = props.stream.getTracks();
  const [currentTrackIndex, updateCurrentTrackIndex] = useState<number>(0);
  useEffect(() => {
    if (canvasRef.current) {
      canvasRef.current.width = tracks[currentTrackIndex]?.getSettings()?.width
        ? tracks[currentTrackIndex].getSettings().width!
        : 100;
      canvasRef.current.height = tracks[currentTrackIndex]?.getSettings()
        ?.height
        ? tracks[currentTrackIndex].getSettings().height!
        : 100;
      if (canvasRef.current.getContext('2d')) {
        updateCanvas(
          tracks[currentTrackIndex].getSettings()?.frameRate
            ? tracks[currentTrackIndex].getSettings().frameRate!
            : 30,
          canvasRef.current.getContext('2d')!,
          props.videoElement,
          canvasRef.current?.width,
          canvasRef.current?.height
        );
      }
    }
  });

  return (
    <>
      <canvas ref={canvasRef} />
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
