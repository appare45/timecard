import {
  Box,
  Button,
  Center,
  Circle,
  Heading,
  HStack,
  List,
  ListItem,
  Select,
  Spacer,
  Spinner,
  Stack,
  Text,
  useToast,
  VStack,
} from '@chakra-ui/react';
import { DocumentSnapshot } from 'firebase/firestore';
import React, {
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useMemo } from 'react';
import {
  IoAnalytics,
  IoEaselOutline,
  IoHome,
  IoPeople,
  IoSettings,
} from 'react-icons/io5';
import { Link as routerLink, Route, Switch } from 'react-router-dom';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { getAccount, getAdmin, getGroup, Group } from '../utils/group';
import { Member, getMember } from '../utils/member';

type groupProps = {
  groupIds: string[];
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
        leftIcon={<IoEaselOutline />}
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
  const { account } = useContext(AuthContext);
  const [currentMemberData, setCurrentMemberData] =
    useState<DocumentSnapshot<Member> | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const toast = useToast();
  // フロントモードの切り替え
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

  // グループデータの取得
  useMemo(() => {
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

  // アカウント情報の取得
  useMemo(() => {
    if (account && currentId)
      getAccount(account.uid, currentId).then((e) => {
        const memberId = e.data()?.memberId;
        if (memberId) {
          getMember(memberId, currentId).then((e) =>
            setCurrentMemberData(e ?? null)
          );
          getAdmin(memberId, currentId).then((e) => {
            if (e.data()) setIsAdmin(true);
          });
        }
      });
  }, [account, currentId]);

  const offlineToastId = 'is-offline';
  const offlineToastRef = useRef<string | number>('');

  useEffect(() => {
    window.addEventListener('offline', () => {
      if (!toast.isActive(offlineToastId))
        // 何故かundefinedを許容しない
        // https://chakra-ui.com/docs/feedback/toast#closing-toasts
        offlineToastRef.current =
          toast({
            title: '接続はオフラインです',
            description: '変更はオンライン復帰後に反映されます',
            status: 'info',
            position: 'bottom-right',
            duration: null,
            isClosable: false,
          }) ?? '';
    });
    window.addEventListener('online', () => {
      toast.close(offlineToastRef.current);
    });
  }, [toast]);

  const AllActivity = React.lazy(() => import('./display-activities'));

  const Nav: React.FC = () => (
    <HStack align="start" h="100vh" py="10" px="5" spacing="20">
      <Box pos="sticky" top="10">
        <GroupSelector
          ids={groupIds}
          groups={groups}
          update={updateCurrentId}
        />
        <List spacing="1" my="5">
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
          <ListItem>
            <MenuLink leftIcon={<IoSettings />} to="/setting">
              設定
            </MenuLink>
          </ListItem>
        </List>
      </Box>
      <Box w="full">
        <Suspense fallback={null}>
          <Switch>
            <Route exact path="/">
              <Heading>最近のアクティビティー</Heading>
              <HStack align="flex-start" w="full" py="6">
                <AllActivity loadMore={false} />
                <Spacer />
                <Stack spacing="4">
                  {isAdmin && (
                    <ScanButton
                      setFrontMode={() => {
                        setFrontMode(true);
                        if (document.fullscreenEnabled)
                          document.body.requestFullscreen();
                      }}
                    />
                  )}
                  <Heading size="sm">オンラインのメンバー</Heading>
                  <MembersList onlyOnline isSimple />
                </Stack>
              </HStack>
            </Route>
            <Route path={`/activity/`}>
              <Activities />
            </Route>
            <Route path={`/member/`}>
              <Members />
            </Route>
            <Route path={`/setting/`}>
              <Setting />
            </Route>
          </Switch>
        </Suspense>
      </Box>
    </HStack>
  );

  const Members = React.lazy(() => import('./members'));
  const Front = React.lazy(() => import('./front'));
  const CreateGroup = React.lazy(() => import('./create-group'));
  const Setting = React.lazy(() => import('./setting'));
  const MembersList = React.lazy(() => import('./members-list'));
  const Activities = React.lazy(() => import('./activity'));
  return (
    <>
      {!!groupIds.length && currentId && (
        <GroupContext.Provider
          value={{
            currentId: currentId,
            ids: groupIds,
            setFrontMode: setFrontMode,
            isAdmin: isAdmin,
            currentMember: currentMemberData,
            updateCurrentMember: setCurrentMemberData,
          }}>
          {frontMode ? (
            <Suspense fallback={<Spinner />}>
              <Front />
            </Suspense>
          ) : (
            <Nav />
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
