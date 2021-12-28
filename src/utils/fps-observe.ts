interface props {
  description?: string;
}

export const observeFps = (props: props): void => {
  const fpsDisplay = document.createElement('div');
  fpsDisplay.setAttribute(
    'style',
    'color: #e53e3e;z-index: 1000000000000000;position: fixed;bottom: 10px;left: 10px;padding: 5px;font-family: monospace;font-size: 0.8em;font-weight:bold'
  );
  window.document.body.appendChild(fpsDisplay);
  let fps = 0;

  const fpsFunc = (): void => {
    fps++;
    requestAnimationFrame(fpsFunc);
  };

  if (props?.description) {
    const descriptionText = document.createElement('span');
    descriptionText.innerText = props.description;
    fpsDisplay.appendChild(descriptionText);
  }

  fpsDisplay.innerText += ' / ';

  const UATxt = document.createElement('span');
  UATxt.innerText = `UA: ${navigator.userAgent}`;
  fpsDisplay.appendChild(UATxt);

  fpsDisplay.innerText += ' / ';

  const fpsText = document.createElement('span');
  fpsDisplay.appendChild(fpsText);

  fpsFunc();

  const updateFps = () => {
    fpsText.innerText = 'FPS:' + String(fps);
    fps = 0;
  };

  setInterval(updateFps, 1000);
};
