import { Input } from '@chakra-ui/input';
import { HStack } from '@chakra-ui/layout';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { QueryDocumentSnapshot } from '@firebase/firestore';
import React, { useContext, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { deleteTag, tag, updateTag } from '../utils/group-tag';
import { BasicButton, CancelButton } from './buttons';
import {
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  ModalHeader,
} from '@chakra-ui/modal';

export const TagSettingModal: React.FC<{
  tag: QueryDocumentSnapshot<tag>;
  onUpdate: () => unknown;
}> = ({ tag, onUpdate }) => {
  const { currentGroup } = useContext(GroupContext);
  const [newTag, setNewTag] = useState<tag>(tag.data());
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        updateTag({
          ref: tag.ref,
          data: newTag,
        }).then(() => {
          onUpdate();
        });
      }}
    >
      <ModalHeader>タグの編集</ModalHeader>
      <ModalCloseButton />
      <ModalBody>
        <FormControl isRequired>
          <FormLabel>名前</FormLabel>
          <Input
            defaultValue={newTag.name}
            onChange={(e) =>
              setNewTag((T) => {
                const S = T;
                S.name = e.target.value;
                return S;
              })
            }
          />
        </FormControl>
      </ModalBody>
      <ModalFooter>
        <HStack>
          <CancelButton
            variant="secondary"
            onClick={async () => {
              if (currentGroup?.id) {
                await deleteTag({
                  groupId: currentGroup?.id,
                  tagId: tag.id,
                });
                onUpdate();
              }
            }}
          >
            タグを削除
          </CancelButton>
          <BasicButton variant="primary" type="submit">
            設定
          </BasicButton>
        </HStack>
      </ModalFooter>
    </form>
  );
};

export default TagSettingModal;
