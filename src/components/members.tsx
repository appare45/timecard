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
  addMember,
  getGroup,
  Group,
  listMembers,
  Member,
} from '../utils/group';
import { dataWithId } from '../utils/firebase';
import { IoAnalyticsSharp, IoCard, IoPersonAdd } from 'react-icons/io5';
import { Card } from './createCard';

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
  console.info(isOpen);
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
        <Heading size="md">メンバー一覧</Heading>
        <Spacer />
        {groupContext.currentId && (
          <AddMember
            groupId={groupContext.currentId}
            onUpdate={() => updateMembersList(groupContext.currentId)}
          />
        )}
      </HStack>
      <Skeleton isLoaded={!isUpdating}>
        <Table colorScheme="blackAlpha" size="sm">
          <Thead>
            <Tr>
              <Th>名前</Th>
            </Tr>
          </Thead>
          <Tbody>
            {members?.map((member) => (
              <Tr key={member.id}>
                <Td>{member.data.name}</Td>
                <Td>
                  <HStack>
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
                      <Button colorScheme="gray" variant="ghost">
                        <Icon as={IoAnalyticsSharp} />
                      </Button>
                    </Tooltip>
                  </HStack>
                </Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
      </Skeleton>
    </>
  );
};

export { MembersList };
