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
export default function QRCodeScan(): JSX.Element {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, updateError] = useState('');
  useEffect(() => {
    let userCamera: MediaStream | null = null;
    getUserCamera()
      .then((e) => {
        userCamera = e;
      })
      .catch((e) => {
        updateError(e);
      });
  });
  return (
    <>
      <p>QRコードを読み取ってください</p>
      <video autoPlay playsInline muted ref={videoRef} />
      <canvas ref={canvasRef} />
      {error && <span>{error}</span>}
    </>
  );
}
