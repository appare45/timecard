import { Input } from '@chakra-ui/input';
import { Text, HStack } from '@chakra-ui/layout';
import { Skeleton } from '@chakra-ui/skeleton';
import { useToast } from '@chakra-ui/toast';
import { DocumentSnapshot } from '@firebase/firestore';
import React, { useContext, useMemo, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { getGroup, Group, setGroup } from '../utils/group';
import { FormButtons } from './assets';
import { AdminSetting } from './AccountList';

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

export default AdminSetting;
