import {
  Box,
  Button,
  Center,
  Circle,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  HStack,
  Icon,
  Input,
  List,
  ListItem,
  Select,
  Text,
  useBoolean,
  VStack,
} from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { IoAnalytics, IoEasel, IoHome, IoPeople } from 'react-icons/io5';
import { Link as routerLink, Route, Switch } from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { createGroup, getGroup, Group } from '../utils/group';
import { setUser } from '../utils/user';
import { Activities, AllActivity } from './activity';
import { Front } from './front';
import { Members } from './members';

type groupProps = {
  groupIds: string[];
};

const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const userContext = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  const submit = async (groupName: string) => {
    if (
      userContext.account?.uid &&
      userContext.account.displayName &&
      userContext.account.photoURL
    ) {
      setIsSubmitting.on();
      try {
        if (groupName.length <= 20 && groupName.length > 0) {
          await createGroup(
            { name: groupName, joinStatus: false },
            {
              id: userContext.account.uid,
              name: userContext.account.displayName,
              photoUrl: userContext.account.photoURL,
            }
          ).then((groupId) => {
            if (userContext.account?.uid) {
              setUser({ groupId: [groupId] }, userContext.account.uid, {
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
          autoFocus
          onChange={(e) => {
            if (e.target.value.length <= 20) {
              setGroupName(e.target.value);
            }
          }}
        />
        <FormHelperText>
          グループ名は1文字以上20文字以内で入力してください
        </FormHelperText>
        <Button type="submit" isLoading={isSubmitting} colorScheme="teal">
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

const ScanButton: React.FC<{ setFrontMode: () => void }> = ({
  setFrontMode,
}) => {
  return (
    <>
      <Button
        mt="5"
        mb="3"
        colorScheme="cyan"
        leftIcon={<Icon as={IoEasel} />}
        onClick={() => setFrontMode()}>
        フロントモードに切り替える
      </Button>
    </>
  );
};

const MenuLink: React.FC<{
  children: string;
  to: string;
  leftIcon: React.ReactElement;
}> = ({ children, to, leftIcon }) => {
  return (
    <Button
      leftIcon={leftIcon}
      variant="link"
      color="black"
      size="lg"
      p="1.5"
      as={routerLink}
      to={to}
      wordBreak="keep-all">
      {children}
    </Button>
  );
};

const GroupUI: React.FC<groupProps> = ({ groupIds }) => {
  const [groups, updateGroups] = useState<Group[]>([]);
  const [currentId, updateCurrentId] = useState<string>();
  const [frontMode, setFrontMode] = useState<boolean>();
  useEffect(() => {
    const dbName = 'Group';
    if (window.indexedDB) {
      const DbOpenRequest = indexedDB.open(dbName);
      DbOpenRequest.onupgradeneeded = () => {
        const Db = DbOpenRequest.result;
        try {
          Db.createObjectStore(dbName).add(frontMode, 'frontMode');
        } catch (error) {
          console.error(error);
        }
      };
      DbOpenRequest.onsuccess = () => {
        const Db = DbOpenRequest.result;
        try {
          const transaction = Db.transaction(dbName, 'readwrite');
          const request = transaction.objectStore(dbName).get('frontMode');
          request.onsuccess = () => {
            if (request.result === undefined) {
              transaction.objectStore(dbName).put(false, 'frontMode');
              setFrontMode(false);
            } else if (frontMode === undefined) {
              setFrontMode(request.result);
            } else {
              transaction.objectStore(dbName).put(frontMode, 'frontMode');
            }
          };
        } catch (error) {
          console.error(error);
        }
      };
    }
  }, [frontMode]);
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
      {!!groupIds.length && currentId && (
        <GroupContext.Provider
          value={{
            currentId: currentId,
            ids: groupIds,
            setFrontMode: (e) => setFrontMode(e),
          }}>
          {frontMode ? (
            <Front />
          ) : (
            <HStack align="start" h="100vh" py="10" px="5" spacing="10">
              <Box pos="sticky" top="10">
                <GroupSelector
                  ids={groupIds}
                  groups={groups}
                  update={updateCurrentId}
                />
                <ScanButton
                  setFrontMode={() => {
                    setFrontMode(true);
                    document.body.requestFullscreen();
                  }}
                />
                <List spacing="1.5" my="2">
                  <ListItem>
                    <MenuLink leftIcon={<IoHome />} to="/">
                      トップ
                    </MenuLink>
                  </ListItem>
                  <ListItem>
                    <MenuLink leftIcon={<IoAnalytics />} to="/activity">
                      タイムライン
                    </MenuLink>
                  </ListItem>
                  <ListItem>
                    <MenuLink leftIcon={<IoPeople />} to="/member">
                      メンバー
                    </MenuLink>
                  </ListItem>
                </List>
              </Box>
              <Box w="full">
                <Switch>
                  <Route exact path="/">
                    <VStack spacing="5" align="flex-start" w="full">
                      <Members />
                      <Heading>最近のアクティビティー</Heading>
                      <AllActivity />
                    </VStack>
                  </Route>
                  <Route path={`/activity/`}>
                    <Activities />
                  </Route>
                  <Route path={`/member/`}>
                    <Members />
                  </Route>
                </Switch>
              </Box>
            </HStack>
          )}
        </GroupContext.Provider>
      )}
      {!currentId && <Circle />}
      {!groupIds.length && (
        <Center h="100vh">
          <VStack p="10" rounded="2xl" shadow="lg">
            <Heading>グループの作成</Heading>
            <section>
              <Text>現在では既存のグループに参加することはできません。</Text>
              <Text>将来的に対応予定なのでしばらくお待ちください</Text>
            </section>
            <CreateGroup />
          </VStack>
        </Center>
      )}
    </>
  );
};

export default GroupUI;
