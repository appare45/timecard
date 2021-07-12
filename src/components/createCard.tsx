import React, { useEffect, useRef, useState } from 'react';

function NameForm(props: { onSubmit: (e: string) => void }): JSX.Element {
  const [name, updateName] = useState('');
  return (
    <form>
      <label htmlFor="name">名前</label>
      <input
        type="text"
        name="name"
        id="name"
        required
        maxLength={25}
        minLength={1}
        size={25}
        spellCheck={false}
        autoComplete="name"
        autoFocus={true}
        value={name}
        onChange={(e) => {
          updateName(e.target.value);
        }}
      />
      <input
        type="submit"
        value="作成"
        disabled={!name}
        onClick={(e) => {
          e.preventDefault();
          props.onSubmit(name);
        }}
      />
    </form>
  );
}

function Card(props: { name: string; id: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const qrRef = useRef<HTMLImageElement>(null);
  const width = 91;
  const height = 55;
  const name = props.name.toUpperCase().replace('　', ' ');
  useEffect(() => {
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext('2d');
      const canvasWidth = canvasRef.current.width;
      const canvasHeight = canvasRef.current.height;
      const yMargin = canvasWidth * 0.07;
      const xMargin = canvasHeight * 0.07; // 単位はpx
      ctx?.strokeRect(0, 0, canvasWidth, canvasHeight);
      if (ctx) {
        ctx.font = `bold ${
          ((canvasWidth * 0.5) / ctx.measureText(name).width) * 10
        }px 'Avenir','Helvetica Neue','Helvetica','Arial','Hiragino Sans','ヒラギノ角ゴシック',YuGothic,'Yu Gothic','メイリオ', Meiryo,'ＭＳ Ｐゴシック','MS PGothic',sans-serif`;
        ctx.textBaseline = 'middle';
        ctx.textAlign = 'right';
        ctx.fillText(
          name,
          canvasRef.current.width - yMargin,
          canvasRef.current.height * 0.5,
          canvasRef.current.width - yMargin
        );
        import('qrcode')
          .then((QRCode) => {
            QRCode.toDataURL(props.id, {
              color: {
                dark: '#99332Eff',
              },
              width: canvasWidth,
            }).then((url) => {
              if (qrRef.current) {
                qrRef.current.src = url;
                ctx.drawImage(
                  qrRef.current,
                  xMargin,
                  yMargin + 10,
                  canvasWidth / 2 - 2 * xMargin,
                  canvasWidth / 2 - 2 * xMargin
                );
              }
            });
          })
          .catch((e) => console.error(e));
      }
    }
  });
  return (
    <>
      <img alt="qrコード" ref={qrRef} />
      <canvas
        ref={canvasRef}
        width={width * 16}
        height={height * 16}
        style={{
          width: '91mm',
          height: '55mm',
          border: '1px solid black',
        }}
      />
    </>
  );
}

export default function CreateCard(): JSX.Element {
  const [name, setName] = useState<string>('');
  return (
    <>
      <h1>カードの作成</h1>
      {!name ? (
        <NameForm
          onSubmit={(e) => {
            setName(e);
          }}
        />
      ) : (
        <Card name={name} id={name} />
      )}
    </>
  );
}
