import { DocumentSnapshot, getDoc } from '@firebase/firestore';
import {
  Box,
  VStack,
  Text,
  Stack,
  Divider,
  HStack,
  Spacer,
} from '@chakra-ui/layout';
import React, { useContext, useMemo, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { Group, setAccount } from '../utils/group';
import { getInvite } from '../utils/invite';
import { setUser } from '../utils/user';
import { BasicButton } from './buttons';
import { LoadingScreen } from './assets';

const JoinGroup: React.FC = () => {
  const Auth = useContext(AuthContext);
  const [invitedGroup, setInvitedGroup] = useState<
    DocumentSnapshot<Group>[] | null
  >(null);
  useMemo(() => {
    if (Auth.account?.email) {
      getInvite(Auth.account.email).then((invite) => {
        setInvitedGroup([]);
        invite.data()?.group.forEach((group) => {
          getDoc(group).then((groupData) => {
            setInvitedGroup((e) => [...(e ?? []), groupData]);
          });
        });
      });
    }
  }, [Auth.account]);
  return (
    <Box>
      {!!invitedGroup?.length && (
        <VStack spacing="4" w="full">
          <Text>招待が届いています</Text>
          <Box>
            <Stack spacing="2" w="full" divider={<Divider />}>
              {invitedGroup.map((group) => (
                <InvitedGroup group={group} key={group.id} />
              ))}
            </Stack>
          </Box>
        </VStack>
      )}
      {invitedGroup?.length === 0 && (
        <Text>招待さているグループがありません</Text>
      )}
      {invitedGroup === null && <LoadingScreen />}
    </Box>
  );
};

const InvitedGroup = ({ group }: { group: DocumentSnapshot<Group> }) => {
  const groupData = group.data();
  const Auth = useContext(AuthContext);

  const joinGroup = () => {
    if (Auth.account)
      setUser({ group: [group.ref] }, Auth.account.uid, {
        merge: true,
      }).then(() => {
        if (Auth.account?.email)
          setAccount(
            Auth.account.email,
            {
              isActive: true,
            },
            group.id
          );
        history.go(0);
      });
  };

  return (
    <HStack w="full">
      {groupData && (
        <>
          <Text>{groupData.name}</Text>
          <Spacer />
          <BasicButton variant="secondary" size="sm" onClick={joinGroup}>
            参加
          </BasicButton>
        </>
      )}
    </HStack>
  );
};

export default JoinGroup;
