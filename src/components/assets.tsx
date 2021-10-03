import { Avatar, AvatarBadge } from '@chakra-ui/avatar';
import { Button, ButtonGroup } from '@chakra-ui/button';
import { HStack, Text, VStack } from '@chakra-ui/layout';
import { Spinner } from '@chakra-ui/spinner';
import React, { useEffect, useRef } from 'react';
import { Member } from '../utils/group';

export const LoadMoreButton: React.FC<{ loadMore: () => void }> = ({
  loadMore,
}) => {
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (e) => {
        if (e[0].isIntersecting) loadMore();
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '10px',
      }
    );
    if (ref.current) {
      observer.observe(ref.current);
    }
  }, [loadMore]);
  return (
    <HStack ref={ref}>
      <Spinner size="sm" colorScheme="red" /> <Text>読込中</Text>
    </HStack>
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
  status?: boolean;
}> = ({ member, size = 'sm', status = true }) => (
  <Avatar src={member?.photoUrl} size={size}>
    {status && (
      <AvatarBadge
        bg={member?.status === 'active' ? 'green.400' : 'gray.400'}
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
