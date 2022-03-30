import React from 'react';
import { Stack } from '@chakra-ui/layout';
import { DocumentSnapshot, QueryDocumentSnapshot } from '@firebase/firestore';
import { Checkbox } from '@chakra-ui/checkbox';
import { Skeleton } from '@chakra-ui/skeleton';
import { useState, useContext, useEffect, useMemo } from 'react';
import { GroupContext } from '../contexts/group';
import { tag, listTag } from '../utils/group-tag';
import { GroupTag } from './assets';
import { Alert } from '@chakra-ui/alert';

export const GroupTagList: React.FC<{
  userTags: {
    ids: string[];
    addTag: (e: DocumentSnapshot<tag>) => void;
    removeTag: (e: DocumentSnapshot<tag>) => void;
  };
}> = ({ userTags }) => {
  // グループのタグ
  const [groupTags, setGroupTags] = useState<DocumentSnapshot<tag>[]>([]);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup) {
      // タグ一覧を取得
      listTag(currentGroup.id).then((e) => {
        const newTags: QueryDocumentSnapshot<tag>[] = [];
        e.forEach((f) => newTags.push(f));
        setGroupTags(newTags);
        setIsLoaded(true);
      });
    }
  }, [currentGroup]);

  return useMemo(() => {
    // 各タグ
    const GroupTagMemo: React.FC<{ tag: DocumentSnapshot<tag> }> = ({
      tag,
    }): JSX.Element | null =>
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
      <Skeleton isLoaded={isLoaded} w="min-content">
        <Stack spacing="2">
          {groupTags.length === 0 && <Alert>タグがありません</Alert>}
          {groupTags.map((tag) => (
            <GroupTagMemo tag={tag} key={tag.id} />
          ))}
        </Stack>
      </Skeleton>
    );
  }, [groupTags, isLoaded, userTags]);
};
