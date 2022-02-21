interface props {
  description?: string;
}

let showing = false;

export const observeFps = (props: props): void => {
  const fpsDisplay = document.createElement('div');
  fpsDisplay.setAttribute(
    'style',
    'color: #fff;z-index: 1000000000000000;position: fixed;top: 15px;left: 10px;padding: 5px;font-family: monospace;font-size: 0.8em;font-weight:bold; background: #0000009f; max-width: 400px'
  );
  window.document.body.appendChild(fpsDisplay);
  showing = true;

  document.addEventListener('keydown', (e) => {
    if (e.code == 'F3') {
      if (showing) {
        fpsDisplay.remove();
        showing = false;
      } else {
        window.document.body.appendChild(fpsDisplay);
        showing = true;
      }
    }
  });

  let fps = 0;

  const fpsFunc = (): void => {
    fps++;
    requestAnimationFrame(fpsFunc);
  };

  if (props?.description) {
    const UATxt = document.createElement('p');
    UATxt.innerText = `UA: ${navigator.userAgent}`;
    fpsDisplay.appendChild(UATxt);

    const descriptionText = document.createElement('p');
    descriptionText.innerText = props.description;
    fpsDisplay.appendChild(descriptionText);
  }

  const fpsText = document.createElement('p');
  fpsDisplay.appendChild(fpsText);

  fpsFunc();

  const updateFps = () => {
    fpsText.innerText = 'FPS:' + String(fps);
    fps = 0;
  };

  setInterval(updateFps, 1000);
};
