import {
  Avatar,
  Box,
  Button,
  Center,
  HStack,
  Icon,
  Spinner,
  Text,
  VStack,
} from '@chakra-ui/react';
import React, { useEffect, useState } from 'react';
import { IoChevronBack, IoChevronForward } from 'react-icons/io5';
import { AuthContext } from '../contexts/user';
import useIsMobile from '../hooks/media-query';
import { Auth, firebase } from '../utils/firebase';
import { getUser, setUser } from '../utils/user';
import GroupUI from './group';
import Login from './login';
import Logout from './logout';
import NewAccount from './new_account';

const UserDataDisplay: React.FC<{ authData: firebase.User }> = ({
  authData,
}) => {
  const isMobile = useIsMobile();
  const [openInfo, setOpenInfo] = useState(!isMobile);
  return (
    <HStack position="fixed" bottom="0" left="0" p="5">
      <Center shadow="sm" p="5">
        <HStack spacing="5">
          <HStack>
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
                    <Button
                      onClick={() => setOpenInfo(!openInfo)}
                      variant="ghost">
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
        </HStack>
      </Center>
    </HStack>
  );
};

export default function User(props: {
  children: JSX.Element[] | JSX.Element;
  path: string;
}): JSX.Element {
  const [loginStatus, updateLoginStatus] = useState<boolean | null>(null);
  const [accountEnabled, updateAccountEnablement] = useState<boolean | null>(
    null
  );
  const [joinedGroups, updateJoinedGroups] = useState<string[]>([]);
  const [authData, setAuthData] = useState<firebase.User>();
  const [defaultName, setDefaultName] = useState<string | null>(null);
  const [accountStatus, updateAccountStatus] = useState<firebase.User>();
  useEffect(() => {
    const unregisterAuthObserver = Auth.onAuthStateChanged((account) => {
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
  }, [updateLoginStatus]);
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
      {/* 読み込み中 */}
      {loginStatus === null && <Spinner />}
      {/* 未ログイン時 */}
      {loginStatus === false && !authData && (
        <Login redirectPath={props.path} />
      )}
      {/* ログイン後アカウント未登録時 */}
      {accountEnabled === false && authData && (
        <NewAccount name={defaultName} id={authData.uid} />
      )}
      {/* ログイン・アカウント登録済 */}
      {loginStatus === true && authData && accountEnabled && (
        <>
          <UserDataDisplay authData={authData} />
          <GroupUI groupIds={joinedGroups} />
        </>
      )}
    </AuthContext.Provider>
  );
}
