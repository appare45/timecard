import React from 'react';
import { Stack } from '@chakra-ui/layout';
import { Checkbox } from '@chakra-ui/react';
import { DocumentSnapshot, QueryDocumentSnapshot } from '@firebase/firestore';
import { useState, useContext, useEffect, useMemo } from 'react';
import { GroupContext } from '../contexts/group';
import { tag, listTag } from '../utils/group-tag';
import { GroupTag } from './assets';

export const GroupTagList: React.FC<{
  userTags: {
    ids: string[];
    addTag: (e: DocumentSnapshot<tag>) => void;
    removeTag: (e: DocumentSnapshot<tag>) => void;
  };
}> = ({ userTags }) => {
  // グループのタグ
  const [groupTags, setGroupTags] = useState<DocumentSnapshot<tag>[]>([]);

  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup) {
      // タグ一覧を取得
      listTag(currentGroup.id).then((e) => {
        const newTags: QueryDocumentSnapshot<tag>[] = [];
        e.forEach((f) => newTags.push(f));
        setGroupTags(newTags);
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
              }}>
              <GroupTag label={tagData.name} color={tagData.color} />
            </Checkbox>
          );
        } else return null;
      }, [tag]);

    return (
      <Stack spacing="2">
        {groupTags.map((tag) => (
          <GroupTagMemo tag={tag} key={tag.id} />
        ))}
      </Stack>
    );
  }, [groupTags, userTags]);
};
