import {
  Box,
  Button,
  Circle,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  Link,
  List,
  ListIcon,
  ListItem,
  Select,
  Text,
  useBoolean,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { IoAnalytics, IoHome, IoQrCode } from 'react-icons/io5';
import { Link as routerLink, Route, Switch } from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { createGroup, getGroup, Group } from '../utils/group';
import { setUser } from '../utils/user';
import { Activities } from './activity';
import { Members } from './members';
import QRCodeScan from './qrcodeScan';

type groupProps = {
  groupIds: string[];
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
  return (
    <>
      <Select
        onChange={(e) => update(e.target.value)}
        colorScheme="gray"
        isFullWidth={false}
        width="50">
        {groups.map((group, key) => (
          <option key={ids[key]} value={ids[key]}>
            {group.name}
          </option>
        ))}
      </Select>
    </>
  );
};

const GroupUI: React.FC<groupProps> = ({ groupIds }) => {
  const [groups, updateGroups] = useState<Group[]>([]);
  const [currentId, updateCurrentId] = useState<string>();
  useEffect(() => {
    const _groups: Group[] = [];
    groupIds.forEach((groupId) => {
      getGroup(groupId).then((group) => {
        if (group) {
          updateGroups([..._groups, group]);
          updateCurrentId(groupIds[0]);
        }
      });
    });
  }, [groupIds]);
  return (
    <>
      {groupIds.length && currentId && (
        <GroupContext.Provider value={{ currentId: currentId, ids: groupIds }}>
          <HStack align="start" h="100vh" py="10" px="5" spacing="5">
            <Box>
              <GroupSelector
                ids={groupIds}
                groups={groups}
                update={updateCurrentId}
              />
              <Button
                size="sm"
                mt="5"
                mb="3"
                colorScheme="red"
                leftIcon={<Icon as={IoQrCode} />}>
                <Link as={routerLink} to="/qr" wordBreak="keep-all">
                  QRコードをスキャンする
                </Link>
              </Button>
              <List spacing="1">
                <ListItem>
                  <ListIcon as={IoHome} />
                  <Link as={routerLink} to="/" wordBreak="keep-all">
                    トップ
                  </Link>
                </ListItem>
                <ListItem>
                  <ListIcon as={IoAnalytics} />
                  <Link as={routerLink} to="/activity" wordBreak="keep-all">
                    アクティビティー
                  </Link>
                </ListItem>
              </List>
            </Box>
            <Box w="full">
              <Switch>
                <Route exact path="/">
                  <Members />
                </Route>
                <Route path="/qr">
                  <QRCodeScan />
                </Route>
                <Route path={`/activity/`}>
                  <Activities />
                </Route>
              </Switch>
            </Box>
          </HStack>
        </GroupContext.Provider>
      )}
      {!currentId && <Circle />}
      {!groupIds.length && (
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
