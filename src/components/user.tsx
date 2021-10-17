import {
  Avatar,
  Box,
  Button,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { Suspense, useState } from 'react';
import { getAuth, onAuthStateChanged, User } from 'firebase/auth';
import { useMemo } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { AuthContext } from '../contexts/user';
import { app } from '../utils/firebase';
import { getUser, setUser } from '../utils/user';
import Logout from './logout';

const UserDataDisplay: React.FC<{ authData: User }> = ({ authData }) => {
  const [openInfo, setOpenInfo] = useState(false);
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
      bg="white">
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
                  whiteSpace="nowrap">
                  {authData.email}
                </Text>
              </Box>
              <Logout />
              <Button onClick={() => setOpenInfo(!openInfo)} variant="ghost">
                <Icon as={IoChevronBack} h="12" />
              </Button>
            </HStack>
          </>
        ) : (
          <Button onClick={() => setOpenInfo(!openInfo)} variant="ghost">
            <Icon as={IoChevronForward} h="12" />
          </Button>
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
  const Auth = getAuth(app);
  const [joinedGroups, updateJoinedGroups] = useState<string[]>([]);
  const [authData, setAuthData] = useState<User>();
  const [defaultName, setDefaultName] = useState<string | null>(null);
  const [accountStatus, updateAccountStatus] = useState<User>();

  useMemo(() => {
    const unregisterAuthObserver = onAuthStateChanged(Auth, (account) => {
      if (updateLoginStatus) {
        updateLoginStatus(account === null ? false : true);
      }
      if (account) {
        setAuthData(account);
        getUser(account.uid)
          .then((user) => {
            if (user) {
              updateAccountEnablement(true);
              updateJoinedGroups(user.groupId ?? []);
              updateAccountStatus(account);
              setUser({ name: user.name }, account.uid, { merge: true });
            } else {
              updateAccountEnablement(false);
              setDefaultName(account.displayName);
            }
          })
          .catch((e) => {
            console.error(e);
          });
      }
    });
    return unregisterAuthObserver;
  }, [Auth]);
  const Login = React.lazy(() => import('./login'));
  const NewAccount = React.lazy(() => import('./new_account'));
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
      }}>
      <Suspense fallback={<Spinner />}>
        {/* 未ログイン時 */}
        {!loginStatus && (
          <Login
            redirectUri={`${location.href}`}
            isLoading={loginStatus === null}
          />
        )}
        {/* ログイン後アカウント未登録時 */}
        {accountEnabled === false && authData && (
          <NewAccount name={defaultName} id={authData.uid} />
        )}
        {/* ログイン・アカウント登録済 */}
        {loginStatus === true && authData && accountEnabled && (
          <>
            <GroupUI groupIds={joinedGroups} />
            <UserDataDisplay authData={authData} />
          </>
        )}
      </Suspense>
    </AuthContext.Provider>
  );
}
