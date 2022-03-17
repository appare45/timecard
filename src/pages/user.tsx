import { Box, HStack, Text, VStack } from '@chakra-ui/layout';
import { useColorMode } from '@chakra-ui/color-mode';
import { Avatar } from '@chakra-ui/avatar';
import { IconButton } from '@chakra-ui/button';
import React, { Suspense, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useMemo } from 'react';
import { IoChevronBack, IoChevronForward, IoMoon } from 'react-icons/io5';
import { AuthContext } from '../contexts/user';
import { getUser, setUser } from '../utils/user';
import Logout from './logout';
import { DocumentReference } from '@firebase/firestore';
import { Group } from '../utils/group';
import { useUniversalColors } from '../hooks/color-mode';
import { LoadingScreen } from '../components/assets';
import { auth } from '../utils/auth';

const UserDataDisplay: React.FC<{ authData: User }> = ({ authData }) => {
  const [openInfo, setOpenInfo] = useState(false);
  const { toggleColorMode } = useColorMode();
  const { component_background, component_foreground } = useUniversalColors();
  return (
    <HStack
      spacing="5"
      shadow="sm"
      p="5"
      pr="0.5"
      m="5"
      bottom="0"
      left="0"
      pos="fixed"
      rounded="lg"
      bg={component_background}
      color={component_foreground}
    >
      <Avatar src={authData.photoURL ?? undefined} />
      <VStack spacing="0.5" align="start">
        {openInfo ? (
          <>
            <HStack>
              <Box>
                <Text maxW="40" textOverflow="ellipsis">
                  {authData.displayName}
                </Text>
                <Text
                  fontSize="xs"
                  maxW="40"
                  overflow="hidden"
                  textOverflow="ellipsis"
                  whiteSpace="nowrap"
                >
                  {authData.email}
                </Text>
              </Box>
              <Logout />
              <IconButton
                icon={<IoMoon />}
                aria-label="ダークモードの切り替え"
                onClick={toggleColorMode}
                variant="outline"
                colorScheme="gray"
              />
              <IconButton
                onClick={() => setOpenInfo(!openInfo)}
                variant="ghost"
                icon={<IoChevronBack />}
                aria-label="ユーザーパネル切り替え"
                h="12"
              />
            </HStack>
          </>
        ) : (
          <IconButton
            onClick={() => setOpenInfo(!openInfo)}
            variant="ghost"
            icon={<IoChevronForward />}
            aria-label="ユーザーパネル切り替え"
            h="12"
          />
        )}
      </VStack>
    </HStack>
  );
};

export default function UserUI(): JSX.Element {
  const [loginStatus, updateLoginStatus] = useState<boolean | null>(null);
  const [accountEnabled, updateAccountEnablement] = useState<boolean | null>(
    null
  );
  const Auth = useMemo(() => auth(), []);
  const [joinedGroups, updateJoinedGroups] = useState<
    DocumentReference<Group>[]
  >([]);
  const [authData, setAuthData] = useState<User>();
  const [accountStatus, updateAccountStatus] = useState<User>();

  useMemo(() => {
    const unregisterAuthObserver = onAuthStateChanged(Auth, (account) => {
      if (updateLoginStatus) {
        updateLoginStatus(account === null ? false : true);
      }
      setAuthData(account ?? undefined);
    });
    return unregisterAuthObserver;
  }, [Auth]);

  useMemo(() => {
    if (authData) {
      {
        getUser(authData.uid)
          .then((user) => {
            if (user) {
              updateAccountEnablement(true);
              updateJoinedGroups(user.group ?? []);
              updateAccountStatus(authData);
              setUser({ name: user.name }, authData.uid, { merge: true });
            } else {
              updateAccountEnablement(false);
            }
          })
          .catch((e) => {
            console.error(e);
          });
      }
    }
  }, [authData]);

  const Login = React.lazy(() => import('./login'));
  const NewAccount = React.lazy(() => import('../components/new_account'));
  const GroupUI = React.lazy(() => import('./group'));
  return (
    <AuthContext.Provider
      value={{
        loginStatus: {
          current: loginStatus,
          update: updateLoginStatus,
        },
        accountEnablement: {
          current: accountEnabled,
          update: updateAccountEnablement,
        },
        account: accountStatus ?? null,
      }}
    >
      <Suspense fallback={<LoadingScreen />}>
        {/* 未ログイン時 */}
        {loginStatus === false && (
          <Login
            redirectUri={`${location.href}`}
            isLoading={loginStatus === null}
          />
        )}
        {/* ログイン後アカウント未登録時 */}
        {accountEnabled === false && authData && (
          <NewAccount id={authData.uid} />
        )}
        {/* ログイン・アカウント登録済 */}
        {loginStatus === true && authData && accountEnabled && (
          <>
            <GroupUI groups={joinedGroups} />
            <UserDataDisplay authData={authData} />
          </>
        )}
      </Suspense>
    </AuthContext.Provider>
  );
}
