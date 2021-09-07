import { Button } from '@chakra-ui/button';
import React from 'react';
import { IoArrowDown } from 'react-icons/io5';

export const LoadMoreButton: React.FC<{ loadMore: () => void }> = ({
  loadMore,
}) => {
  return (
    <Button onClick={loadMore} variant="link" leftIcon={<IoArrowDown />}>
      さらに読み込む
    </Button>
  );
};
