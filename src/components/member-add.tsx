import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useBoolean } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
} from '@chakra-ui/modal';
import { Button } from '@chakra-ui/react';
import React, { useState } from 'react';
import { IoPersonAdd } from 'react-icons/io5';
import { atom, useRecoilState } from 'recoil';
import { Member, addMember } from '../utils/member';
import { GroupTagList } from './group-tag-control';

const NewMemberState = atom<Member>({
  key: 'NewMemberState',
  default: {
    name: '',
    tag: [],
    photoUrl: '',
    status: 'inactive',
  },
  dangerouslyAllowMutability: true,
});

export const AddMember: React.FC<{ groupId: string; onUpdate: () => void }> = ({
  groupId,
  onUpdate,
}) => {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  const [newMember, setNewMember] = useRecoilState(NewMemberState);
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
              if (newMember.name && newMember.name.length < 20) {
                addMember(newMember, groupId)
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
                  value={newMember.name}
                  onChange={(e) => {
                    const _data: Member = Object.assign({}, newMember);
                    if (e.target.value.length <= 20) {
                      _data.name = e.target.value;
                    }
                    setNewMember(_data);
                  }}
                />
              </FormControl>
              <FormControl>
                <FormLabel>ラベル</FormLabel>
                <GroupTagList
                  userTags={{
                    ids: newMember.tag.map((e) => e.id),
                    addTag: (e) => {
                      setNewMember((member) => {
                        return {
                          ...member,
                          ...{ tag: [...member.tag, e.ref] },
                        };
                      });
                    },
                    removeTag: (e) => {
                      setNewMember((member) => {
                        const index = member.tag.findIndex(
                          (tag) => tag.id == e.id
                        );
                        return {
                          ...member,
                          ...{
                            tag: [
                              ...member.tag.slice(0, index),
                              ...member.tag.slice(index + 1),
                            ],
                          },
                        };
                      });
                    },
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
