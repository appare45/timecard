import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Heading,
  HStack,
  Input,
  useBoolean,
} from '@chakra-ui/react';
import { serverTimestamp } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { setUser } from '../utils/user';

type Props = {
  id: string;
};

const NewAccount: React.FC<Props> = ({ id }) => {
  const localAuthContext = useContext(AuthContext);
  const [input, updateInput] = useState<string>('');
  const { account } = useContext(AuthContext);
  useEffect(() => {
    updateInput(account?.displayName ?? '');
  }, [account?.displayName]);
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  async function applyUserName(setName: string, id: string): Promise<void> {
    if (!(setName.length > 0)) {
      return;
    }
    setIsSubmitting.on();
    try {
      await setUser(
        {
          name: setName,
          updated: serverTimestamp(),
        },
        id
      ).then(() => {
        if (localAuthContext.accountEnablement.update) {
          localAuthContext.accountEnablement.update(true);
        }
      });
      setIsSubmitting.off();
    } catch (error) {
      console.error(error);
      setIsSubmitting.off();
    }
  }
  return (
    <Box p="10">
      <Heading>アカウント登録</Heading>
      <FormControl>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            applyUserName(input, id);
          }}
        >
          <FormLabel>名前</FormLabel>
          <HStack>
            <Input
              autoFocus
              onChange={(e) => {
                updateInput(e.target.value);
              }}
            />
            <Button type="submit" isLoading={isSubmitting}>
              登録
            </Button>
          </HStack>
        </form>
      </FormControl>
    </Box>
  );
};

export default NewAccount;
