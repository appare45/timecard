import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Select,
  Skeleton,
  Text,
  useBoolean,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { createGroup, getGroup, Group } from '../utils/group';
import { setUser } from '../utils/user';

type groupProps = {
  groupIds: string[];
  children: JSX.Element;
};

const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const userContext = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  const submit = async (groupName: string) => {
    if (userContext.account.id && userContext.account.name) {
      setIsSubmitting.on();
      try {
        if (groupName.length <= 20 && groupName.length > 0) {
          await createGroup(
            { name: groupName, joinStatus: false },
            { id: userContext.account.id, name: userContext.account.name }
          ).then((groupId) => {
            if (userContext.account.id) {
              setUser({ groupId: [groupId] }, userContext.account.id, {
                merge: true,
              });
            }
          });
        } else {
          throw new Error('グループ名は20文字以内で入力してください');
        }
        setIsSubmitting.off();
      } catch (error) {
        console.error(error);
        setIsSubmitting.off();
      }
    }
    return;
  };
  return (
    <FormControl isRequired>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          submit(groupName);
        }}>
        <FormLabel>グループ名</FormLabel>
        <Input
          minLength={1}
          maxLength={20}
          value={groupName}
          onChange={(e) => {
            if (e.target.value.length <= 20) {
              setGroupName(e.target.value);
            }
          }}
        />
        <FormHelperText>
          グループ名は1文字以上20文字以内で入力してください
        </FormHelperText>
        <Button type="submit" isLoading={isSubmitting}>
          作成
        </Button>
      </form>
    </FormControl>
  );
};

const GroupSelector: React.FC<{
  ids: string[];
  groups: Group[];
  update: (e: string) => void;
}> = ({ ids, groups, update }) => {
  const [isLoaded, setIsLoaded] = useBoolean(false);
  useEffect(() => {
    if (groups.length) {
      console.info(groups.length);
      setIsLoaded.on();
    }
  }, [groups, setIsLoaded]);
  return (
    <Skeleton isLoaded={isLoaded}>
      <Select onChange={(e) => update(e.target.value)}>
        {groups.map((group, key) => (
          <option key={ids[key]} value={ids[key]}>
            {group.name}
          </option>
        ))}
      </Select>
    </Skeleton>
  );
};

const GroupUI: React.FC<groupProps> = ({ groupIds, children }) => {
  const [groups, updateGroups] = useState<Group[]>([]);
  useEffect(() => {
    const _groups: Group[] = [];
    groupIds.forEach((groupId) => {
      getGroup(groupId).then((group) => {
        if (group) {
          updateGroups([..._groups, group]);
        }
      });
    });
  }, [groupIds]);
  const [currentId, updateCurrentId] = useState<string>(groupIds[0]);
  return (
    <>
      {groupIds.length ? (
        <>
          <Text>参加しているグループ一覧</Text>
          <GroupSelector
            ids={groupIds}
            groups={groups}
            update={updateCurrentId}
          />
          {children}
        </>
      ) : (
        <>
          <Heading>グループの作成</Heading>
          <section>
            <Text>現在では既存のグループに参加することはできません。</Text>
            <Text>将来的に対応予定なのでしばらくお待ちください</Text>
          </section>
          <CreateGroup />
        </>
      )}
    </>
  );
};

export default GroupUI;
