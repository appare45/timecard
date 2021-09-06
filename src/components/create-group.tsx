import { useBoolean } from '@chakra-ui/hooks';
import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
} from '@chakra-ui/react';
import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { createGroup } from '../utils/group';
import { setUser } from '../utils/user';

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

export default CreateGroup;
