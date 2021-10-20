export const observeFps = (): void => {
  const fpsDisplay = document.createElement('div');
  fpsDisplay.setAttribute(
    'style',
    'color: #e53e3e;z-index: 1000000000000000;position: fixed;top: 10px;right: 10px;padding: 5px;font-family: monospace;font-size: 1.1em;font-weight:bold'
  );
  fpsDisplay.innerText = 'FPS';
  window.document.body.appendChild(fpsDisplay);
  let fps = 0;

  const fpsFunc = (): void => {
    fps++;
    requestAnimationFrame(fpsFunc);
  };

  fpsFunc();

  const updateFps = () => {
    fpsDisplay.innerText = 'FPS:' + String(fps);
    fps = 0;
  };

  setInterval(updateFps, 1000);
};
