import {
  Button,
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
  Spacer,
  Table,
  Tbody,
  Td,
  Th,
  Thead,
  Tr,
  useBoolean,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { addMember, listMembers, Member } from '../utils/group';
import { dataWithId } from '../utils/firebase';
import { IoAdd, IoCard } from 'react-icons/io5';

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
        leftIcon={<IoAdd />}
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

const MembersList: React.FC = () => {
  const groupContext = useContext(GroupContext);
  const [members, setMembers] = useState<dataWithId<Member>[]>();
  const updateMembersList = (groupId: string | null) => {
    if (groupId) {
      listMembers(groupId).then((members) => {
        if (members) {
          const _members: dataWithId<Member>[] = [];
          members.forEach((member) => {
            _members.push({ id: member.id, data: member.data() });
          });
          setMembers(_members);
        }
      });
    }
  };
  useEffect(() => {
    updateMembersList(groupContext.currentId);
  }, [groupContext.currentId]);
  return (
    <>
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
                <Button colorScheme="gray" variant="ghost">
                  <Icon as={IoCard} />
                </Button>
              </Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

export { MembersList };
