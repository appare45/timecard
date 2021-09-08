import { Avatar, AvatarBadge } from '@chakra-ui/avatar';
import { Button, ButtonGroup } from '@chakra-ui/button';
import { VStack } from '@chakra-ui/layout';
import React from 'react';
import { IoArrowDown } from 'react-icons/io5';
import { Member, memberStatus } from '../utils/group';

export const LoadMoreButton: React.FC<{ loadMore: () => void }> = ({
  loadMore,
}) => {
  return (
    <Button onClick={loadMore} variant="link" leftIcon={<IoArrowDown />}>
      さらに読み込む
    </Button>
  );
};

export const SideWidget: React.FC = ({ children }) => (
  <VStack
    mt="10"
    border="1px"
    bg="gray.50"
    borderColor="gray.200"
    p="5"
    rounded="base"
    align="flex-start">
    {children}
  </VStack>
);

export const MemberAvatar: React.FC<{
  member?: Member;
  size?: string;
  status?: memberStatus;
}> = ({ member, size = 'sm', status }) => (
  <Avatar src={member?.photoUrl} size={size}>
    {status && (
      <AvatarBadge
        bg={status === 'inactive' ? 'gray.400' : 'green.400'}
        boxSize="1em"
      />
    )}
  </Avatar>
);

export const FormButtons: React.FC<{
  editMode: boolean;
  setEditable: () => void;
  onCancel: () => void;
  onSave: () => void;
  saveAvailable?: boolean;
}> = ({ editMode, onCancel, onSave, setEditable, saveAvailable = true }) => (
  <ButtonGroup colorScheme="green">
    {editMode ? (
      <>
        <Button isDisabled={!saveAvailable} onClick={onSave}>
          保存
        </Button>
        <Button onClick={onCancel} variant="ghost" colorScheme="red">
          キャンセル
        </Button>
      </>
    ) : (
      <Button colorScheme="green" variant="outline" onClick={setEditable}>
        編集
      </Button>
    )}
  </ButtonGroup>
);
