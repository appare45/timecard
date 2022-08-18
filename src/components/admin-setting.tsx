import { Input } from '@chakra-ui/input';
import { Text, HStack, Box, Stack, Heading } from '@chakra-ui/layout';
import { FormControl, FormLabel } from '@chakra-ui/form-control';
import { useDisclosure } from '@chakra-ui/hooks';
import { Alert, AlertIcon } from '@chakra-ui/alert';
import {
  Modal,
  ModalContent,
  ModalOverlay,
  ModalBody,
  ModalCloseButton,
  ModalHeader,
  ModalFooter,
} from '@chakra-ui/modal';
import { Tag, TagCloseButton, TagLabel, TagLeftIcon } from '@chakra-ui/tag';
import { Table, Td, Tr } from '@chakra-ui/table';
import { Skeleton } from '@chakra-ui/skeleton';
import { useToast } from '@chakra-ui/toast';
import { DocumentSnapshot, QueryDocumentSnapshot } from '@firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { IoKeyOutline, IoPin } from 'react-icons/io5';
import useSWR from 'swr';
import { GroupContext } from '../contexts/group';
import { getGroup, Group, setGroup } from '../utils/group';
import { createPlace, deletePlace, listPlace, place } from '../utils/place';
import { firestoreFetcher } from '../utils/swr-fetcher';
import { AccountList } from './AccountList';
import { FormButtons } from './assets';
import { BasicButton } from './buttons';
import { TagSetting } from './tag-setting';

export const OrganizationName = (): JSX.Element => {
  const { currentGroup } = useContext(GroupContext);
  useMemo(() => {
    if (currentGroup)
      getGroup(currentGroup.id).then((e) => {
        if (e) setCurrentGroupData(e);
        setOrganizationName(e?.data()?.name);
      });
  }, [currentGroup]);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupData, setCurrentGroupData] =
    useState<DocumentSnapshot<Group>>();
  const [organizationName, setOrganizationName] = useState<string>();
  const toast = useToast();
  return (
    <HStack spacing="5">
      <Text wordBreak="keep-all">組織名</Text>
      <Skeleton isLoaded={!!organizationName}>
        <Input
          value={organizationName}
          isReadOnly={!editMode}
          onChange={(e) => setOrganizationName(e.target.value)}
        />
      </Skeleton>
      <FormButtons
        isDisable={!organizationName}
        onCancel={() => {
          setEditMode(false);
          setOrganizationName(currentGroupData?.data()?.name);
        }}
        editMode={editMode}
        onSave={() => {
          const _group = currentGroupData?.data();

          if (_group && organizationName && currentGroup) {
            _group.name = organizationName;
            setGroup(_group, currentGroup.id).catch(() => {
              setOrganizationName(currentGroupData?.data()?.name);
              toast({
                status: 'error',
                title: '保存に失敗しました',
              });
            });
          }
          setEditMode(false);
        }}
        setEditable={() => setEditMode(true)}
        saveAvailable={
          organizationName != currentGroupData?.data()?.name &&
          !!organizationName
        }
      />
    </HStack>
  );
};

export const CreatePlace: React.FC<{ onSuccess: () => unknown }> = ({
  onSuccess,
}) => {
  const [name, updateName] = useState('');
  const { currentGroup } = useContext(GroupContext);
  return (
    <>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>拠点の作成</ModalHeader>
        <ModalCloseButton />
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (currentGroup)
              createPlace({
                place: { name: name },
                groupId: currentGroup?.id,
              }).then(() => onSuccess());
          }}
        >
          <ModalBody>
            <FormControl isRequired>
              <FormLabel>名前</FormLabel>
              <Input
                value={name}
                onChange={(e) => updateName(e.target.value)}
              />
            </FormControl>
          </ModalBody>
          <ModalFooter>
            <BasicButton type="submit" variant="primary">
              作成
            </BasicButton>
          </ModalFooter>
        </form>
      </ModalContent>
    </>
  );
};

export const PlaceSetting: React.FC = () => {
  const { currentGroup } = useContext(GroupContext);
  const {
    data: places,
    error,
    mutate,
  } = useSWR<QueryDocumentSnapshot<place>[]>(
    [listPlace, currentGroup?.id],
    firestoreFetcher
  );
  useEffect(() => {
    places?.forEach((e) => console.info(e.data()));
  }, [places]);
  const { onClose, onOpen, isOpen } = useDisclosure();
  return (
    <Box>
      <HStack>
        <Heading size="lg" pb={2}>
          拠点
        </Heading>
        <BasicButton variant="secondary" onClick={onOpen}>
          追加
        </BasicButton>
      </HStack>
      <Modal isOpen={isOpen} onClose={onClose}>
        <CreatePlace
          onSuccess={() => {
            onClose();
            mutate();
          }}
        />
      </Modal>
      <Box>
        <Skeleton isLoaded={!!places?.length}>
          <Table>
            {places?.map((e) => (
              <Tr key={e.id}>
                <Td>
                  <Tag>
                    <TagLeftIcon as={IoPin} />
                    {e.data().name}
                    <TagCloseButton
                      onClick={() => {
                        deletePlace(e);
                        mutate();
                      }}
                    />
                  </Tag>{' '}
                </Td>
              </Tr>
            ))}
          </Table>
        </Skeleton>
        {!places?.length && (
          <Alert status="info">
            <AlertIcon />
            拠点が登録されていません
          </Alert>
        )}
        {error && (
          <Alert status="warning">
            <AlertIcon />
            エラーが発生しました{error}
          </Alert>
        )}
      </Box>
    </Box>
  );
};

export const AdminSetting: React.FC = () => {
  return (
    <Box>
      <Stack py="4" spacing="8">
        <HStack spacing="4">
          <Heading size="lg">組織設定</Heading>
          <Tag>
            <TagLeftIcon as={IoKeyOutline} />
            <TagLabel>管理者のみが設定できます</TagLabel>
          </Tag>
        </HStack>
        <OrganizationName />
        <TagSetting />
        <PlaceSetting />
        <AccountList />
      </Stack>
    </Box>
  );
};
export default AdminSetting;
