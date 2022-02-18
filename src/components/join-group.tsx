import {
  Box,
  Button,
  Divider,
  HStack,
  Spacer,
  Stack,
  Text,
  VStack,
} from '@chakra-ui/react';
import { DocumentSnapshot, getDoc } from '@firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { AuthContext } from '../contexts/user';
import { Group, setAccount } from '../utils/group';
import { getInvite } from '../utils/invite';
import { setUser } from '../utils/user';

const JoinGroup: React.FC = () => {
  const Auth = useContext(AuthContext);
  const history = useHistory();
  const [invitedGroup, setInvitedGroup] = useState<DocumentSnapshot<Group>[]>(
    []
  );
  useEffect(() => {
    if (Auth.account?.email) {
      getInvite(Auth.account.email).then((invite) => {
        console.info(invite.data());
        invite.data()?.group.forEach((group) => {
          getDoc(group).then((groupData) => {
            setInvitedGroup((e) => [...e, groupData]);
          });
        });
      });
    }
  }, [Auth.account, history]);
  return (
    <Box>
      {invitedGroup.length ? (
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
      ) : (
        <Text>招待さているグループがありません</Text>
      )}
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
          <Button variant="outline" onClick={joinGroup}>
            参加
          </Button>
        </>
      )}
    </HStack>
  );
};

export default JoinGroup;
