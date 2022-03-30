import React from 'react';
import { Stack } from '@chakra-ui/layout';
import { DocumentSnapshot, QueryDocumentSnapshot } from '@firebase/firestore';
import { Checkbox } from '@chakra-ui/checkbox';
import { Skeleton } from '@chakra-ui/skeleton';
import { useContext, useMemo } from 'react';
import { GroupContext } from '../contexts/group';
import { tag, listTag } from '../utils/group-tag';
import { GroupTag } from './assets';
import { Alert } from '@chakra-ui/alert';
import useSWR from 'swr';

export const GroupTagList: React.FC<{
  userTags: {
    ids: string[];
    addTag: (e: DocumentSnapshot<tag>) => void;
    removeTag: (e: DocumentSnapshot<tag>) => void;
  };
}> = ({ userTags }) => {
  // グループのタグ

  const { currentGroup } = useContext(GroupContext);
  const { data, error } = useSWR(currentGroup?.id, listTag);
  console.warn(data, currentGroup?.id);

  return useMemo(() => {
    // 各タグ
    const GroupTagMemo: React.FC<{
      tag: DocumentSnapshot<tag> | QueryDocumentSnapshot<tag>;
    }> = ({ tag }): JSX.Element | null =>
      useMemo(() => {
        const tagData = tag.data();
        if (tagData) {
          return (
            <Checkbox
              defaultChecked={
                userTags.ids.find((e) => e === tag.id) != undefined
              }
              onChange={(e) => {
                if (e.target.checked) {
                  userTags.addTag(tag);
                } else {
                  userTags.removeTag(tag);
                }
              }}
            >
              <GroupTag tag={tag} />
            </Checkbox>
          );
        } else return null;
      }, [tag]);

    return (
      <Skeleton isLoaded={!!data} w="min-content">
        <Stack spacing="2">
          {data?.length === 0 && <Alert>タグがありません</Alert>}
          {data?.map((tag) => (
            <GroupTagMemo tag={tag} key={tag.id} />
          ))}
          {error && <Alert variant="solid">エラーが発生しました</Alert>}
        </Stack>
      </Skeleton>
    );
  }, [data, userTags, error]);
};
