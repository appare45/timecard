import { Box, HStack, Circle, Center } from '@chakra-ui/layout';
import { Routes } from 'react-router-dom';
import { useToast } from '@chakra-ui/toast';
import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  Timestamp,
} from 'firebase/firestore';
import React, {
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react';
import { useMemo } from 'react';
import { Nav } from './../components/nav';
import { Route } from 'react-router-dom';
import { LoadingScreen } from '../components/assets';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { useIsPrint } from '../hooks/media-query';
import {
  Account,
  getAccount,
  getAdmin,
  Group,
  setAccount,
} from '../utils/group';
import { Member, getMember } from '../utils/member';

type groupProps = {
  groups: DocumentReference<Group>[];
};

const GroupUI: React.FC<groupProps> = ({ groups }) => {
  const [currentGroup, updateCurrentGroup] =
    useState<DocumentSnapshot<Group>>();
  const [frontMode, setFrontMode] = useState<boolean>();
  const { account } = useContext(AuthContext);
  const [currentMemberData, setCurrentMemberData] =
    useState<DocumentSnapshot<Member> | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const toast = useToast();

  const isPrint = useIsPrint();
  const [groupDataList, setGroupDataList] = useState<DocumentSnapshot<Group>[]>(
    []
  );

  // グループデータの取得
  useMemo(() => {
    groups.forEach((_group) => {
      getDoc(_group).then((group) => {
        if (group) {
          setGroupDataList((_group) => [..._group, group]);
          updateCurrentGroup(group);
        }
      });
    });
  }, [groups]);
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
  // アカウント情報の取得
  useMemo(() => {
    if (account?.email && currentGroup)
      getAccount(account.email, currentGroup.id).then((e) => {
        const memberId = e.data()?.memberId;
        if (memberId) {
          getMember(memberId, currentGroup.id).then((e) => {
            setCurrentMemberData(e ?? null);
          });
          getAdmin(memberId, currentGroup.id).then((e) => {
            if (e.data()) setIsAdmin(true);
          });
        }
        const _account: Partial<Account> = {
          isActive: true,
          lastActivity: Timestamp.now(),
        };
        Object.assign(_account, e.data());
        if (account.email) {
          setAccount(account.email, _account, currentGroup.id);
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

  const Members = React.lazy(() => import('./members'));
  const Front = React.lazy(() => import('../components/front'));
  const NewGroup = React.lazy(() => import('../components/new-group'));
  const Setting = React.lazy(() => import('./setting'));
  const Activities = React.lazy(() => import('./timeline'));
  const Top = React.lazy(() => import('./top'));
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
          }}
        >
          {frontMode ? (
            <Suspense fallback={<LoadingScreen />}>
              <Front />
            </Suspense>
          ) : (
            <>
              <HStack align="start" minH="100vh" py="10" px="5" spacing="10">
                {!isPrint && (
                  <Nav
                    updateCurrentGroup={(e) => updateCurrentGroup(e)}
                    groups={groupDataList}
                  />
                )}
                <Box flexGrow={1}>
                  <Suspense fallback={LoadingScreen}>
                    <Routes>
                      <Route
                        path="/"
                        element={<Top setFrontMode={setFrontMode} />}
                      />
                      <Route path={`activity/*`} element={<Activities />} />
                      <Route path={`member/*`} element={<Members />} />
                      <Route path={`setting/`} element={<Setting />} />
                    </Routes>
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
