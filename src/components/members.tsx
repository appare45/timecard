import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Link,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spacer,
  Switch,
  Table,
  Tbody,
  Td,
  Text,
  Th,
  Thead,
  Tooltip,
  Tr,
  useBoolean,
} from '@chakra-ui/react';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { GroupContext } from '../contexts/group';
import {
  activity,
  addMember,
  getGroup,
  getLatestActivity,
  Group,
  listMembers,
  Member,
  work,
} from '../utils/group';
import { dataWithId } from '../utils/firebase';
import { IoCard, IoPersonAdd } from 'react-icons/io5';
import { Card } from './createCard';
import {
  Link as RouterLink,
  Route,
  useRouteMatch,
  Switch as RouteSwitch,
} from 'react-router-dom';
import { ReactElement } from 'react';
import { ActivityStatus, UserActivity } from './activity';

const AddMember: React.FC<{ groupId: string; onUpdate: () => void }> = ({
  groupId,
  onUpdate,
}) => {
  const [memberData, setMemberData] = useState<Member>();
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  return (
    <>
      <Button
        colorScheme="blackAlpha"
        color="black"
        size="sm"
        onClick={() => setModalIsOpen(true)}
        leftIcon={<IoPersonAdd />}
        variant="outline">
        メンバーを追加
      </Button>
      <Modal onClose={() => setModalIsOpen(false)} isOpen={modalIsOpen}>
        <ModalOverlay />
        <ModalContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setIsSubmitting.on();
              if (memberData && memberData.name.length < 20) {
                addMember(memberData, groupId)
                  .then(() => {
                    setIsSubmitting.off();
                    setModalIsOpen(false);
                    onUpdate();
                  })
                  .catch((error) => {
                    console.error(error);
                  });
              }
              setIsSubmitting.off();
            }}>
            <ModalHeader>メンバーを追加</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <FormControl isRequired>
                <FormLabel>名前</FormLabel>
                <Input
                  colorScheme="blackAlpha"
                  maxLength={20}
                  autoFocus
                  value={memberData?.name ?? ''}
                  onChange={(e) => {
                    const _data: Member = Object.assign({}, memberData);
                    if (e.target.value.length <= 20) {
                      _data.name = e.target.value;
                    }
                    setMemberData(_data);
                  }}
                />
              </FormControl>
            </ModalBody>
            <ModalFooter>
              <Button
                colorScheme="blackAlpha"
                bg="black"
                type="submit"
                isLoading={isSubmitting}>
                作成
              </Button>
            </ModalFooter>
          </form>
        </ModalContent>
      </Modal>
    </>
  );
};

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
  return (
    <Drawer placement="bottom" isOpen={isOpen} onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent>
        <DrawerHeader>
          {`${member.data.name}のカード`}
          <DrawerCloseButton />
        </DrawerHeader>
        <DrawerBody>
          {group && <Card member={member} group={group} />}
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
    if (currentId && data.id) {
      getLatestActivity(currentId, data.id).then((status) =>
        setCurrentStatus(status?.data())
      );
    }
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
          <Td>{data.data.name}</Td>
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

const MembersList: React.FC = () => {
  const groupContext = useContext(GroupContext);
  const [isUpdating, setIsUpdating] = useState(true);
  const [memberCardDisplay, setMemberCardDisplay] = useBoolean(false);
  const [displayCardMember, setDisplayCardMember] =
    useState<dataWithId<Member>>();
  const [shownMembers, setShownMembers] = useState<dataWithId<Member>[]>();
  const [sortWithOnline, setSortWithOnline] = useState(false);
  const updateMembersList = useCallback((groupId: string | null) => {
    setIsUpdating(true);
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
  }, []);
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
      <HStack w="full">
        <Heading>メンバー一覧</Heading>
        <Spacer />
        {groupContext.currentId && (
          <AddMember
            groupId={groupContext.currentId}
            onUpdate={() => {
              if (groupContext.currentId)
                updateMembersList(groupContext.currentId);
            }}
          />
        )}
      </HStack>
      <HStack spacing="2" p="1" my="2" w="full">
        <Text>進行中のみ表示</Text>
        <Switch
          isChecked={sortWithOnline}
          onChange={() => setSortWithOnline(!sortWithOnline)}
          colorScheme="green"
        />
      </HStack>
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
    </>
  );
};

const Members: React.FC = () => {
  const { path } = useRouteMatch();
  return (
    <>
      <RouteSwitch>
        <Route exact path={path}>
          <MembersList />
        </Route>
        <Route path={`${path}:memberId`}>
          <UserActivity />
        </Route>
      </RouteSwitch>
    </>
  );
};

export { Members };
