import { useDisclosure } from '@chakra-ui/hooks';
import { Box, Heading, HStack, Code, Link } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { Table, Tr, Td } from '@chakra-ui/table';
import { Tag, TagLabel, TagLeftIcon } from '@chakra-ui/tag';
import { QueryDocumentSnapshot } from '@firebase/firestore';
import React, {
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { IoKeySharp, IoPerson, IoTrash } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { Link as routerLink } from 'react-router-dom';
import {
  Account,
  deleteAccount,
  deleteAdmin,
  getAdmin,
  listAccount,
} from '../utils/group';
import { getMember } from '../utils/member';
import { CopyButton } from './assets';
import useSWR from 'swr';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import { firestoreFetcher } from '../utils/swr-fetcher';
import { BasicButton, CancelButton } from './buttons';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Modal,
  ModalContent,
  ModalOverlay,
} from '@chakra-ui/modal';
import { deleteInvite, getInvite } from '../utils/invite';
import { Button, ButtonGroup } from '@chakra-ui/react';

export const AccountList = (): React.ReactElement => {
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
    <>
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
    </>
  );
};
const AccountItem = ({
  account,
}: {
  account: QueryDocumentSnapshot<Account>;
}) => {
  const { currentGroup, currentMember } = useContext(GroupContext);
  const { data: member, mutate } = useSWR(
    [account.data().memberId, currentGroup?.id],
    getMember
  );
  const [isAdmin, setIsAdmin] = useState(false);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const cancelRef = useRef(null);
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
        {currentMember?.id === member?.id ? (
          '自分を削除することはできません'
        ) : (
          <>
            <AlertDialog
              isOpen={isOpen}
              onClose={onClose}
              leastDestructiveRef={cancelRef}
            >
              <AlertDialogOverlay>
                <AlertDialogContent>
                  <AlertDialogHeader>アカウント消去</AlertDialogHeader>
                  <AlertDialogBody>
                    アカウントを消去してもよろしいですか？
                    消去を取り消すことはできません。消去後もアクティビティーは残り続けます。
                  </AlertDialogBody>
                  <AlertDialogFooter>
                    <ButtonGroup>
                      <Button
                        colorScheme="red"
                        variant="outline"
                        ref={cancelRef}
                        onClick={onClose}
                      >
                        キャンセル
                      </Button>
                      <CancelButton
                        variant="primary"
                        onClick={async () => {
                          getInvite(account.id).then(
                            async (e) => await deleteInvite(e.ref)
                          );
                          await deleteAccount(account.ref);
                          if (isAdmin && member && currentGroup) {
                            getAdmin(member?.id, currentGroup?.id).then(
                              async (e) => await deleteAdmin(e.ref)
                            );
                          }
                          onClose();
                          mutate();
                        }}
                      >
                        消去
                      </CancelButton>
                    </ButtonGroup>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialogOverlay>
            </AlertDialog>
            <CancelButton
              variant="secondary"
              size="sm"
              leftIcon={<IoTrash />}
              onClick={onOpen}
            >
              削除
            </CancelButton>
          </>
        )}
      </Td>
    </Tr>
  );
};
