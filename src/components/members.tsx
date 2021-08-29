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
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Skeleton,
  Spacer,
  Table,
  Tbody,
  Td,
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
import { IoAnalyticsSharp, IoCard, IoPersonAdd } from 'react-icons/io5';
import { Card } from './createCard';
import { Link } from 'react-router-dom';
import { ReactElement } from 'react';
import { ActivityStatus } from './activity';

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
}> = ({ data, buttons }) => {
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
  );
};

const MembersList: React.FC = () => {
  const groupContext = useContext(GroupContext);
  const [members, setMembers] = useState<dataWithId<Member>[]>();
  const [isUpdating, setIsUpdating] = useState(true);
  const [memberCardDisplay, setMemberCardDisplay] = useBoolean(false);
  const [displayCardMember, setDisplayCardMember] =
    useState<dataWithId<Member>>();
  const updateMembersList = useCallback((groupId: string | null) => {
    setIsUpdating(true);
    if (groupId) {
      listMembers(groupId).then((members) => {
        if (members) {
          const _members: dataWithId<Member>[] = [];
          members.forEach((member) => {
            _members.push({ id: member.id, data: member.data() });
          });
          setMembers(_members);
        }
        setIsUpdating(false);
      });
    }
    setIsUpdating(false);
  }, []);
  useEffect(() => {
    updateMembersList(groupContext.currentId);
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
      <HStack>
        <Heading>メンバー一覧</Heading>
        <Spacer />
        {groupContext.currentId && (
          <AddMember
            groupId={groupContext.currentId}
            onUpdate={() => updateMembersList(groupContext.currentId)}
          />
        )}
      </HStack>
      <Skeleton isLoaded={!isUpdating}>
        <Table colorScheme="blackAlpha" size="sm" mt="5">
          <Thead>
            <Tr>
              <Th>名前</Th>
            </Tr>
          </Thead>
          <Tbody>
            {members?.map((member) => (
              <MemberRow
                key={member.id}
                data={member}
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
                    <Tooltip label="履歴を見る">
                      <Link to={`/activity/${member.id}`}>
                        <Button colorScheme="gray" variant="ghost">
                          <Icon as={IoAnalyticsSharp} />
                        </Button>
                      </Link>
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
  return (
    <>
      <MembersList />
    </>
  );
};

export { Members };
