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
} from '@chakra-ui/react';
import React, {
  useContext,
  useState,
  useCallback,
  useEffect,
  ReactElement,
  Suspense,
} from 'react';
import { IoCard } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { Link as RouterLink } from 'react-router-dom';
import { dataWithId } from '../utils/firebase';
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

const MemberCardDrawer: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  groupId: string;
  member: dataWithId<Member>;
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
          {`${member.data.name}のカード`}
          <DrawerCloseButton />
        </DrawerHeader>
        <DrawerBody>
          <Suspense fallback={<Skeleton />}>
            {group && <Card member={member} group={group} />}
          </Suspense>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
};

const MemberRow: React.FC<{
  data: dataWithId<Member>;
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
              {data.data.name}
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
              {data.data.name}
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
  const groupContext = useContext(GroupContext);
  const [isUpdating, setIsUpdating] = useState(true);
  const [memberCardDisplay, setMemberCardDisplay] = useBoolean(false);
  const [displayCardMember, setDisplayCardMember] =
    useState<dataWithId<Member>>();
  const [shownMembers, setShownMembers] = useState<dataWithId<Member>[]>([]);
  const [sortWithOnline, setSortWithOnline] = useState(onlyOnline);
  const updateMembersList = useCallback(
    (groupId: string | null) => {
      setIsUpdating(true);
      console.info(update);
      if (groupId) {
        listMembers(groupId).then((members) => {
          if (members) {
            const _members: dataWithId<Member>[] = [];
            members.forEach((member) => {
              _members.push({ id: member.id, data: member.data() });
            });
            setShownMembers(_members);
          }
          setIsUpdating(false);
        });
      }
      setIsUpdating(false);
    },
    [update]
  );
  useEffect(() => {
    if (groupContext?.currentId) updateMembersList(groupContext.currentId);
  }, [groupContext.currentId, updateMembersList]);
  return (
    <>
      {displayCardMember && groupContext.currentId && (
        <MemberCardDrawer
          member={displayCardMember}
          isOpen={memberCardDisplay}
          groupId={groupContext.currentId}
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
          表示するメンバーがいません
        </Alert>
      ) : (
        <Skeleton isLoaded={!isUpdating} w="full">
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
        </Skeleton>
      )}
    </>
  );
};

export default MembersList;
