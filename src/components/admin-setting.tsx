import { Input } from '@chakra-ui/input';
import { Box, Heading, Text, HStack, Stack } from '@chakra-ui/layout';
import { Tag, TagLabel, TagLeftIcon } from '@chakra-ui/tag';
import { useToast } from '@chakra-ui/toast';
import React, { useContext, useMemo, useState } from 'react';
import { IoKeyOutline } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { getGroup, Group, setGroup } from '../utils/group';
import { FormButtons } from './assets';

const OrganizationName = () => {
  const { currentId } = useContext(GroupContext);
  useMemo(() => {
    if (currentId)
      getGroup(currentId).then((e) => {
        if (e) setCurrentGroup(e);
        setOrganizationName(e?.name);
      });
  }, [currentId]);
  const [editMode, setEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group>();
  const [organizationName, setOrganizationName] = useState(currentGroup?.name);
  const toast = useToast();
  return (
    <HStack spacing="5">
      <Text wordBreak="keep-all">組織名</Text>
      <Input
        value={organizationName}
        isReadOnly={!editMode}
        onChange={(e) => setOrganizationName(e.target.value)}
      />
      <FormButtons
        onCancel={() => {
          setEditMode(false);
          setOrganizationName(currentGroup?.name);
        }}
        editMode={editMode}
        onSave={() => {
          const _group = currentGroup;

          if (_group && organizationName && currentId) {
            _group.name = organizationName;
            setGroup(_group, currentId)
              .then(() =>
                toast({
                  status: 'success',
                  title: '保存しました',
                })
              )
              .catch(() => {
                setOrganizationName(currentGroup?.name);
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
          organizationName != currentGroup?.name && !!organizationName
        }
      />
    </HStack>
  );
};

const AdminSetting: React.FC = () => {
  return (
    <Box>
      <HStack spacing="4">
        <Heading size="lg">組織設定</Heading>
        <Tag>
          <TagLeftIcon as={IoKeyOutline} />
          <TagLabel>管理者のみが設定できます</TagLabel>
        </Tag>
      </HStack>
      <Stack py="4">
        <OrganizationName />
      </Stack>
    </Box>
  );
};

export default AdminSetting;
