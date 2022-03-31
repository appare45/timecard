import { Input } from '@chakra-ui/input';
import { useDisclosure } from '@chakra-ui/hooks';
import {
  Box,
  Heading,
  Text,
  HStack,
  Stack,
  Circle,
  Code,
  Link,
} from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { Table, Tr, Td } from '@chakra-ui/table';
import { Tag, Tag as TagElement, TagLabel, TagLeftIcon } from '@chakra-ui/tag';
import { useToast } from '@chakra-ui/toast';
import { DocumentSnapshot, QueryDocumentSnapshot } from '@firebase/firestore';
import React, {
  Suspense,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { IoKeyOutline, IoKeySharp, IoPerson } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { Link as routerLink } from 'react-router-dom';
import {
  Account,
  getAdmin,
  getGroup,
  Group,
  listAccount,
  setGroup,
} from '../utils/group';
import { getMember } from '../utils/member';
import { CopyButton, FormButtons } from './assets';
import { TagSetting } from './tag-setting';
import useSWR from 'swr';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { firestoreFetcher } from '../utils/swr-fetcher';
import { BasicButton } from './buttons';
import { Modal, ModalContent, ModalOverlay } from '@chakra-ui/modal';

const OrganizationName = () => {
  const { currentGroup } = useContext(GroupContext);
  useMemo(() => {
    if (currentGroup)
      getGroup(currentGroup.id).then((e) => {
        if (e) setCurrentGroupData(e);
        setOrganizationName(e?.data()?.name);
      });
  }, [currentGroup]);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupData, setCurrentGroupData] =
    useState<DocumentSnapshot<Group>>();
  const [organizationName, setOrganizationName] = useState<string>();
  const toast = useToast();
  return (
    <HStack spacing="5">
      <Text wordBreak="keep-all">組織名</Text>
      <Skeleton isLoaded={!!organizationName}>
        <Input
          value={organizationName}
          isReadOnly={!editMode}
          onChange={(e) => setOrganizationName(e.target.value)}
        />
      </Skeleton>
      <FormButtons
        isDisable={!organizationName}
        onCancel={() => {
          setEditMode(false);
          setOrganizationName(currentGroupData?.data()?.name);
        }}
        editMode={editMode}
        onSave={() => {
          const _group = currentGroupData?.data();

          if (_group && organizationName && currentGroup) {
            _group.name = organizationName;
            setGroup(_group, currentGroup.id).catch(() => {
              setOrganizationName(currentGroupData?.data()?.name);
              toast({
                status: 'error',
                title: '保存に失敗しました',
              });
            });
          }
          setEditMode(false);
        }}
        setEditable={() => setEditMode(true)}
        saveAvailable={
          organizationName != currentGroupData?.data()?.name &&
          !!organizationName
        }
      />
    </HStack>
  );
};

const AccountList = () => {
  const { currentGroup } = useContext(GroupContext);
  const {
    data: accounts,
    error,
    mutate,
  } = useSWR<QueryDocumentSnapshot<Account>[]>(
    [listAccount, currentGroup?.id],
    firestoreFetcher
  );
  const Invite = React.lazy(() => import('./InviteElement'));
  const { onClose, onOpen, isOpen } = useDisclosure();
  return (
    <Box>
      <HStack>
        <Heading size="lg" pb="2">
          連携済みアカウント
        </Heading>
        <BasicButton variant="secondary" onClick={onOpen}>
          招待
        </BasicButton>
      </HStack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <Suspense fallback={<Skeleton />}>
            <Invite
              onSuccess={() => {
                onClose();
                mutate();
              }}
            />
          </Suspense>
        </ModalContent>
      </Modal>
      <Skeleton isLoaded={!!accounts}>
        <Table alignItems="flex-start">
          {accounts != undefined && (
            <>
              {accounts.map((account) => (
                <AccountItem account={account} key={account.id} />
              ))}
            </>
          )}
        </Table>
      </Skeleton>
      {error && (
        <Alert status="error">
          <AlertIcon />
          エラーが発生しました
        </Alert>
      )}
    </Box>
  );
};

const AccountItem = ({
  account,
}: {
  account: QueryDocumentSnapshot<Account>;
}) => {
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const { currentGroup } = useContext(GroupContext);
  const { data: member } = useSWR(
    [account.data().memberId, currentGroup?.id],
    getMember
  );
  useEffect(() => {
    if (currentGroup) {
      try {
        getAdmin(account.data().memberId, currentGroup.id).then((e) => {
          if (e.data()) {
            setIsAdmin(true);
          }
        });
      } catch {
        setIsAdmin(false);
      }
    }
  }, [account, currentGroup]);
  return (
    <Tr>
      <Td>
        <HStack spacing="1">
          <Link as={routerLink} to={`/member/${member?.id}`}>
            {member?.data()?.name}
          </Link>
        </HStack>
      </Td>
      <Td>
        <Tag colorScheme={isAdmin ? 'green' : 'gray'}>
          <TagLeftIcon as={isAdmin ? IoKeySharp : IoPerson} />
          <TagLabel>{isAdmin ? '管理者' : '通常'}</TagLabel>
        </Tag>
      </Td>
      <Td>
        <HStack>
          <Code>{account.id.replace(/.+@/g, '******@')}</Code>
          <CopyButton copyTarget={account.id} size="xs"></CopyButton>
        </HStack>
      </Td>
      <Td>
        <HStack alignItems="center">
          <Circle
            bgColor={account.data().isActive ? 'green.400' : 'gray.400'}
            size="3"
          />
          <Text>{account.data().isActive ? 'アクティブ' : '承諾待ち'}</Text>
        </HStack>
      </Td>
    </Tr>
  );
};

const AdminSetting: React.FC = () => {
  return (
    <Box>
      <Stack py="4" spacing="8">
        <HStack spacing="4">
          <Heading size="lg">組織設定</Heading>
          <TagElement>
            <TagLeftIcon as={IoKeyOutline} />
            <TagLabel>管理者のみが設定できます</TagLabel>
          </TagElement>
        </HStack>
        <OrganizationName />
        <TagSetting />
        <AccountList />
      </Stack>
    </Box>
  );
};

export default AdminSetting;
