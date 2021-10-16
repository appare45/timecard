import React, { useMemo } from 'react';
import { LoadMoreButton } from '../components/assets';
export const useLoadMore = (loadMore: () => void): JSX.Element => {
  return useMemo(() => {
    return <LoadMoreButton loadMore={loadMore} />;
  }, [loadMore]);
};
