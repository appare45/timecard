import React, { useState } from 'react';
import { Button } from '@chakra-ui/react';
import { IoEasel } from 'react-icons/io5';

export const FullScreenSwitch = (): JSX.Element => {
  const [isFullscreen, setIsFullscreen] = useState(
    !!document.fullscreenElement
  );
  return (
    <Button
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
    </Button>
  );
};
