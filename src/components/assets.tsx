import { Avatar, AvatarBadge } from '@chakra-ui/avatar';
import { Button, ButtonGroup, IconButton } from '@chakra-ui/button';
import { HStack, Text, VStack } from '@chakra-ui/layout';
import {
  TagCloseButton,
  TagLeftIcon,
  useClipboard,
  useColorModeValue,
} from '@chakra-ui/react';
import { Spinner } from '@chakra-ui/spinner';
import { Tag, TagLabel } from '@chakra-ui/tag';
import React, { useEffect, useRef } from 'react';
import { IoCheckmark, IoClipboardOutline, IoPricetag } from 'react-icons/io5';
import { tagColors } from '../utils/group-tag';
import { Member } from '../utils/member';

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

export const SideWidget: React.FC = ({ children }) => {
  return (
    <VStack
      mt="10"
      border="1px"
      bg={useColorModeValue('gray.50', 'gray.950')}
      borderColor={useColorModeValue('gray.200', 'gray.800')}
      p="5"
      rounded="base"
      align="flex-start"
    >
      {children}
    </VStack>
  );
};

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

export const GroupTag: React.FC<{
  label: React.ReactElement | string;
  color: tagColors;
  size?: string;
  onRemove?: () => void;
}> = ({ label, color, size = 'md', onRemove }) => {
  return (
    <Tag colorScheme={color} size={size}>
      <TagLeftIcon as={IoPricetag} />
      <TagLabel>{label}</TagLabel>
      {onRemove && <TagCloseButton onClick={onRemove} />}
    </Tag>
  );
};

export const CopyButton = ({
  copyTarget,
  children,
  size,
}: {
  copyTarget: string;
  children?: string;
  size?: string;
}): JSX.Element => {
  const clipBoard = useClipboard(copyTarget);
  if (children) {
    return (
      <Button
        leftIcon={
          clipBoard.hasCopied ? <IoCheckmark /> : <IoClipboardOutline />
        }
        colorScheme={clipBoard.hasCopied ? 'green' : undefined}
        variant={'outline'}
        size={size}
        onClick={clipBoard.onCopy}
      >
        {children}
      </Button>
    );
  } else {
    return (
      <IconButton
        size={size}
        colorScheme={clipBoard.hasCopied ? 'green' : undefined}
        variant={'outline'}
        onClick={clipBoard.onCopy}
        aria-label="コピー"
        icon={clipBoard.hasCopied ? <IoCheckmark /> : <IoClipboardOutline />}
      />
    );
  }
};
