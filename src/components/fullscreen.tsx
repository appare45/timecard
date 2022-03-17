import React, { useState } from 'react';
import { IoEasel } from 'react-icons/io5';
import { BasicButton } from './buttons';

export const FullScreenSwitch = (): JSX.Element => {
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement
  );
  return (
    <BasicButton
      variant="secondary"
      leftIcon={<IoEasel />}
      onClick={() => {
        if (isFullscreen) {
          document.exitFullscreen();
        } else {
          document.documentElement.requestFullscreen();
        }
        setIsFullscreen(!!document.fullscreenElement);
      }}
    >
      フルスクリーン切り替え
    </BasicButton>
  );
};
