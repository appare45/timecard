import { useBoolean } from '@chakra-ui/hooks';
import { HStack } from '@chakra-ui/layout';
import {
  Skeleton,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Text,
  Tooltip,
  Button,
  Switch,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  Link,
  Td,
  Alert,
  AlertIcon,
  VStack,
} from '@chakra-ui/react';
import React, {
  useContext,
  useState,
  useEffect,
  ReactElement,
  Suspense,
} from 'react';
import { IoCard } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { Link as RouterLink } from 'react-router-dom';
import {
  Member,
  listMembers,
  getGroup,
  Group,
  getMember,
  memberStatus,
} from '../utils/group';
import { QueryDocumentSnapshot } from '@firebase/firestore';
import { LoadMoreButton, MemberAvatar } from './assets';

const MemberCardDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  member: QueryDocumentSnapshot<Member>;
}> = ({ isOpen, onClose, member, groupId }) => {
  const [group, setGroup] = useState<Group | null>(null);
  useEffect(() => {
    getGroup(groupId).then((group) => setGroup(group));
  }, [groupId]);
  const Card = React.lazy(() => import('./createCard'));
  return (
    <Drawer placement="bottom" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>
          {`${member.data().name}のカード`}
          <DrawerCloseButton />
        </DrawerHeader>
        <DrawerBody>
          <Suspense fallback={<Skeleton />}>
            {group && (
              <Card
                member={{
                  id: member.id,
                  data: member.data(),
                }}
                group={group}
              />
            )}
          </Suspense>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

const MemberRow: React.FC<{
  data: QueryDocumentSnapshot<Member>;
  buttons: ReactElement;
  isSimple?: boolean;
}> = ({ data, buttons, isSimple = false }) => {
  const [currentStatus, setCurrentStatus] = useState<memberStatus>();
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    let isSubscribed = true;
    if (currentId && data.id) {
      getMember(data.id, currentId).then((e) => {
        if (isSubscribed) setCurrentStatus(e?.data()?.status ?? undefined);
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [currentId, data.id]);
  return (
    <>
      <Tr>
        <Td>
          <HStack>
            <MemberAvatar
              member={data.data()}
              size={isSimple ? 'xs' : undefined}
              status={currentStatus}
            />
            <Link as={RouterLink} to={`/member/${data.id}`}>
              {data.data().name}
            </Link>
          </HStack>
        </Td>
        {!isSimple && (
          <Td>
            <HStack>{buttons}</HStack>
          </Td>
        )}
      </Tr>
    </>
  );
};

const MembersList: React.FC<{
  onlyOnline?: boolean;
  update?: boolean;
  isSimple?: boolean;
}> = ({ onlyOnline = false, update, isSimple = false }) => {
  const { currentId, currentMember, isAdmin } = useContext(GroupContext);
  const [isUpdating, setIsUpdating] = useState(true);
  const [memberCardDisplay, setMemberCardDisplay] = useBoolean(false);
  const [displayCardMember, setDisplayCardMember] =
    useState<QueryDocumentSnapshot<Member>>();
  const [shownMembers, setShownMembers] = useState<
    QueryDocumentSnapshot<Member>[]
  >([]);
  const [sortWithOnline, setSortWithOnline] = useState(onlyOnline);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot>();

  const loadMoreData = (startFrom: QueryDocumentSnapshot) => {
    if (currentId)
      listMembers(
        currentId,
        5,
        undefined,
        sortWithOnline ? 'active' : undefined,
        startFrom
      ).then((members) => {
        const membersList: QueryDocumentSnapshot<Member>[] = [];
        members?.forEach((_) => membersList.push(_));
        setLastDoc(membersList[4] ?? null);
        setShownMembers([...shownMembers, ...membersList]);
      });
  };

  useEffect(() => {
    console.info(update);
    setIsUpdating(true);
    if (currentId) {
      listMembers(
        currentId,
        5,
        undefined,
        sortWithOnline ? 'active' : undefined
      ).then((members) => {
        if (members) {
          const _members: QueryDocumentSnapshot<Member>[] = [];
          members.forEach((member) => {
            _members.push(member);
          });
          setLastDoc(_members[4]);
          setShownMembers(_members);
        }
        setIsUpdating(false);
      });

      setIsUpdating(false);
    }
  }, [currentId, sortWithOnline, update]);
  return (
    <>
      {displayCardMember && currentId && (
        <MemberCardDrawer
          member={displayCardMember}
          isOpen={memberCardDisplay}
          groupId={currentId}
          onClose={() => setMemberCardDisplay.off()}
        />
      )}
      {!onlyOnline && (
        <HStack spacing="2" p="1" my="2" w="full">
          <Text>進行中のみ表示</Text>
          <Switch
            isChecked={sortWithOnline}
            onChange={() => {
              setSortWithOnline(!sortWithOnline);
            }}
            colorScheme="green"
          />
        </HStack>
      )}
      {!shownMembers.length ? (
        <Alert>
          <AlertIcon />
          {sortWithOnline
            ? 'オンラインのメンバーがいません'
            : '表示するメンバーがいません'}
        </Alert>
      ) : (
        <Skeleton isLoaded={!isUpdating} w="full">
          <VStack spacing="4">
            <Table
              colorScheme="blackAlpha"
              size={isSimple ? 'sm' : 'md'}
              mt={!isSimple ? '5' : '0.5'}
              w="full">
              <Thead>
                <Tr>
                  <Th>名前</Th>
                  <Th></Th>
                </Tr>
              </Thead>
              <Tbody>
                {shownMembers?.map((member) => (
                  <MemberRow
                    key={member.id}
                    data={member}
                    isSimple={isSimple}
                    buttons={
                      <>
                        {(currentMember?.id == member.id || isAdmin) && (
                          <Tooltip label="カードを表示">
                            <Button
                              colorScheme="gray"
                              variant="ghost"
                              onClick={() => {
                                setDisplayCardMember(member);
                                setMemberCardDisplay.on();
                              }}>
                              <IoCard />
                            </Button>
                          </Tooltip>
                        )}
                      </>
                    }
                  />
                ))}
              </Tbody>
            </Table>
            {lastDoc && (
              <LoadMoreButton loadMore={() => loadMoreData(lastDoc)} />
            )}
          </VStack>
        </Skeleton>
      )}
    </>
  );
};

export default MembersList;
