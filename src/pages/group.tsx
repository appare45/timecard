import {
  Box,
  Button,
  Center,
  Circle,
  Heading,
  HStack,
  Icon,
  Link,
  Select,
  Spinner,
  Stack,
  Text,
  useToast,
} from '@chakra-ui/react';
import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
} from 'firebase/firestore';
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
import { RecoilRoot } from 'recoil';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { useIsPrint } from '../hooks/media-query';
import { GroupTemplate } from '../templates/group';
import { getAccount, getAdmin, Group } from '../utils/group';
import { Member, getMember } from '../utils/member';

type groupProps = {
  groups: DocumentReference<Group>[];
};

const GroupSelector: React.FC<{
  groups: DocumentSnapshot<Group>[];
  update: (e: DocumentSnapshot<Group> | undefined) => void;
}> = ({ groups, update }) => {
  return (
    <>
      <Select
        onChange={(e) =>
          update(groups.find((group) => group.id === e.target.value))
        }
        colorScheme="gray"
        isFullWidth={false}
        width="50">
        {groups.map((group) => (
          <option key={group.id} value={group.id}>
            {group?.data()?.name ?? ''}
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
  leftIcon: React.FC;
}> = ({ children, to, leftIcon }) => {
  return (
    <Link
      variant="link"
      color="black"
      fontSize="lg"
      p="1.5"
      w="full"
      textAlign="left"
      as={routerLink}
      to={to}
      fontWeight="bold"
      wordBreak="keep-all">
      <Stack direction="row" align="center" spacing="2">
        <Icon as={leftIcon} />
        <Text>{children}</Text>
      </Stack>
    </Link>
  );
};

const GroupUI: React.FC<groupProps> = ({ groups }) => {
  const [groupDataList, setGroupDataList] = useState<DocumentSnapshot<Group>[]>(
    []
  );
  const [currentGroup, updateCurrentGroup] =
    useState<DocumentSnapshot<Group>>();
  const [frontMode, setFrontMode] = useState<boolean>();
  const { account } = useContext(AuthContext);
  const [currentMemberData, setCurrentMemberData] =
    useState<DocumentSnapshot<Member> | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const toast = useToast();

  const isPrint = useIsPrint();
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
    groups.forEach((group) => {
      getDoc(group).then((group) => {
        if (group) {
          setGroupDataList((_group) => [..._group, group]);
          updateCurrentGroup(group);
        }
      });
    });
  }, [groups]);

  // アカウント情報の取得
  useMemo(() => {
    if (account?.email && currentGroup)
      getAccount(account.email, currentGroup.id).then((e) => {
        const memberId = e.data()?.memberId;
        if (memberId) {
          getMember(memberId, currentGroup.id).then((e) =>
            setCurrentMemberData(e ?? null)
          );
          getAdmin(memberId, currentGroup.id).then((e) => {
            if (e.data()) setIsAdmin(true);
          });
        }
      });
  }, [account?.email, currentGroup]);

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

  const AllActivity = React.lazy(
    () => import('../components/display-activities')
  );

  const Nav: React.FC = () => {
    return (
      <Box pos="sticky" top="10" h="full">
        <GroupSelector groups={groupDataList} update={updateCurrentGroup} />
        <Stack spacing="1" my="5" align="flex-start">
          <MenuLink leftIcon={IoHome} to="/">
            トップ
          </MenuLink>
          <MenuLink leftIcon={IoAnalytics} to="/activity">
            タイムライン
          </MenuLink>
          <MenuLink leftIcon={IoPeople} to="/member">
            メンバー
          </MenuLink>
          <MenuLink leftIcon={IoSettings} to="/setting">
            設定
          </MenuLink>
        </Stack>
      </Box>
    );
  };

  const Members = React.lazy(() => import('./members'));
  const Front = React.lazy(() => import('../components/front'));
  const NewGroup = React.lazy(() => import('../components/new-group'));
  const Setting = React.lazy(() => import('./setting'));
  const MembersList = React.lazy(() => import('../components/members-list'));
  const Activities = React.lazy(() => import('./timeline'));
  return (
    <>
      {!!groups.length && currentGroup && (
        <GroupContext.Provider
          value={{
            setFrontMode: setFrontMode,
            isAdmin: isAdmin,
            currentMember: currentMemberData,
            updateCurrentMember: setCurrentMemberData,
            currentGroup: currentGroup,
          }}>
          {frontMode ? (
            <Suspense fallback={<Spinner />}>
              <Front />
            </Suspense>
          ) : (
            <>
              <HStack align="start" h="100vh" py="10" px="5" spacing="20">
                {!isPrint && <Nav />}
                <Box flexGrow={1}>
                  <Suspense fallback={null}>
                    <Switch>
                      <Route exact path="/">
                        <GroupTemplate
                          title="最新のアクティビティー"
                          sideWidget={
                            <>
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
                              <RecoilRoot>
                                <MembersList onlyOnline isSimple />
                              </RecoilRoot>
                            </>
                          }>
                          <AllActivity loadMore={false} />
                        </GroupTemplate>
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
            </>
          )}
        </GroupContext.Provider>
      )}
      {!currentGroup && <Circle />}
      {!groups.length && (
        <Center h="100vh">
          <Box p="10" rounded="2xl" shadow="lg">
            <NewGroup />
          </Box>
        </Center>
      )}
    </>
  );
};

export default GroupUI;
