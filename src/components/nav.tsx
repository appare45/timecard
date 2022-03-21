import React from 'react';
import { Box, Link, Stack, Text } from '@chakra-ui/layout';
import { Select } from '@chakra-ui/select';
import { Icon } from '@chakra-ui/icon';
import { Link as routerLink } from 'react-router-dom';
import { IoAnalytics, IoHome, IoPeople, IoSettings } from 'react-icons/io5';
import { useUniversalColors } from '../hooks/color-mode';
import { DocumentSnapshot } from 'firebase/firestore';
import { Group } from '../utils/group';
const GroupSelector: React.FC<{
  update: (e: DocumentSnapshot<Group> | undefined) => void;
  groups: DocumentSnapshot<Group>[];
}> = ({ update, groups }) => {
  return (
    <>
      <Select
        onChange={(e) =>
          update(groups.find((group) => group.id === e.target.value))
        }
        colorScheme="gray"
        isFullWidth={false}
        width="50"
      >
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group?.data()?.name ?? ''}
          </option>
        ))}
      </Select>
    </>
  );
};

const MenuLink: React.FC<{
  children: string;
  to: string;
  leftIcon: React.FC;
}> = ({ children, to, leftIcon }) => {
  const { component_foreground } = useUniversalColors();
  return (
    <Link
      variant="link"
      color={component_foreground}
      display="block"
      _hover={{
        bg: 'green.100',
      }}
      rounded="md"
      fontSize="lg"
      p="1.5"
      px="3"
      w="full"
      textAlign="left"
      as={routerLink}
      to={to}
      fontWeight="bold"
      wordBreak="keep-all"
    >
      <Stack direction="row" align="center" spacing="2">
        <Icon as={leftIcon} />
        <Text>{children}</Text>
      </Stack>
    </Link>
  );
};

export const Nav: React.FC<{
  groups: DocumentSnapshot<Group>[];
  updateCurrentGroup: (e: DocumentSnapshot<Group> | undefined) => void;
}> = ({ updateCurrentGroup, groups }) => {
  return (
    <Box pos="sticky" top="10" h="full">
      <GroupSelector update={updateCurrentGroup} groups={groups} />
      <Stack spacing="1" my="5" align="flex-start">
        <MenuLink leftIcon={IoHome} to="/">
          トップ
        </MenuLink>
        <MenuLink leftIcon={IoAnalytics} to="/activity">
          タイムライン
        </MenuLink>
        <MenuLink leftIcon={IoPeople} to="/member">
          メンバー
        </MenuLink>
        <MenuLink leftIcon={IoSettings} to="/setting">
          設定
        </MenuLink>
      </Stack>
    </Box>
  );
};
