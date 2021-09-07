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
  Icon,
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
  activity,
  getGroup,
  getLatestActivity,
  Group,
  work,
} from '../utils/group';
import { ActivityStatus } from './activity';
import { QueryDocumentSnapshot } from '@firebase/firestore';
import { LoadMoreButton } from './assets';

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
  isOnline?: boolean;
}> = ({ data, buttons, isOnline }) => {
  const [currentStatus, setCurrentStatus] = useState<activity<work>>();
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    let isSubscribed = true;
    if (currentId && data.id) {
      getLatestActivity(currentId, data.id).then((status) => {
        if (isSubscribed) setCurrentStatus(status?.data());
      });
    }
    return () => {
      isSubscribed = false;
    };
  }, [currentId, data.id]);
  return (
    <>
      {!isOnline && (
        <Tr>
          <Td>
            <Link as={RouterLink} to={`/member/${data.id}`}>
              {data.data().name}
            </Link>
          </Td>
          <Td>
            <HStack>{buttons}</HStack>
          </Td>
          <Td>
            {currentStatus?.content.status ? (
              <ActivityStatus workStatus={currentStatus?.content.status} />
            ) : (
              <Skeleton width="14" />
            )}
          </Td>
        </Tr>
      )}
      {isOnline && currentStatus?.content.status == 'running' && (
        <Tr>
          <Td>
            <Link as={RouterLink} to={`/member/${data.id}`}>
              {data.data().name}
            </Link>
          </Td>
          <Td>
            <HStack>{buttons}</HStack>
          </Td>
          <Td>
            {currentStatus?.content.status ? (
              <ActivityStatus workStatus={currentStatus?.content.status} />
            ) : (
              <Skeleton width="14" />
            )}
          </Td>
        </Tr>
      )}
    </>
  );
};

const MembersList: React.FC<{ onlyOnline?: boolean; update?: boolean }> = ({
  onlyOnline = false,
  update,
}) => {
  const { currentId } = useContext(GroupContext);
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
      listMembers(currentId, 5, undefined, sortWithOnline, startFrom).then(
        (members) => {
          const membersList: QueryDocumentSnapshot<Member>[] = [];
          members?.forEach((_) => membersList.push(_));
          setLastDoc(membersList[4] ?? null);
          setShownMembers([...shownMembers, ...membersList]);
        }
      );
  };

  useEffect(() => {
    console.info(update);
    setIsUpdating(true);
    if (currentId) {
      listMembers(currentId, 5, undefined, sortWithOnline).then((members) => {
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
            <Table colorScheme="blackAlpha" size="sm" mt="5" w="full">
              <Thead>
                <Tr>
                  <Th>名前</Th>
                </Tr>
              </Thead>
              <Tbody>
                {shownMembers?.map((member) => (
                  <MemberRow
                    key={member.id}
                    data={member}
                    isOnline={sortWithOnline}
                    buttons={
                      <>
                        <Tooltip label="カードを表示">
                          <Button
                            colorScheme="gray"
                            variant="ghost"
                            onClick={() => {
                              setDisplayCardMember(member);
                              setMemberCardDisplay.on();
                            }}>
                            <Icon as={IoCard} />
                          </Button>
                        </Tooltip>
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
