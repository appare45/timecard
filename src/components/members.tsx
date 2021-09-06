import {
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spacer,
  useBoolean,
} from '@chakra-ui/react';
import React, { Suspense, useContext, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { addMember, Member } from '../utils/group';
import { IoPersonAdd } from 'react-icons/io5';
import { Route, useRouteMatch, Switch as RouteSwitch } from 'react-router-dom';

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

const Members: React.FC = () => {
  const { path } = useRouteMatch();
  const UserActivity = React.lazy(() => import('./user-activity'));
  const MembersList = React.lazy(() => import('./members-list'));
  const groupContext = useContext(GroupContext);
  const [update, setUpdate] = useState(false);
  return (
    <>
      <RouteSwitch>
        <Route exact path={path}>
          <HStack w="full">
            <Heading>メンバー一覧</Heading>
            <Spacer />
            {groupContext.currentId && (
              <AddMember
                groupId={groupContext.currentId}
                onUpdate={() => {
                  console.info('updated');
                  setUpdate(!update);
                }}
              />
            )}
          </HStack>
          <MembersList update={update} />
        </Route>
        <Route path={`${path}:memberId`}>
          <Suspense fallback={null}>
            <UserActivity />
          </Suspense>
        </Route>
      </RouteSwitch>
    </>
  );
};

export default Members;
