import { useBoolean } from '@chakra-ui/hooks';
import React, { useContext, useState } from 'react';
import {
  FormControl,
  FormLabel,
  FormHelperText,
} from '@chakra-ui/form-control';
import { Input } from '@chakra-ui/input';
import { AuthContext } from '../contexts/user';
import { createGroup } from '../utils/group';
import { Member, setMember } from '../utils/member';
import { setUser } from '../utils/user';
import { BasicButton } from './buttons';

const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  const userContext = useContext(AuthContext);
  const [isSubmitting, setIsSubmitting] = useBoolean(false);
  const create_group = async (groupName: string) => {
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
              name: userContext.account.displayName,
              photoUrl: userContext.account.photoURL,
              status: 'inactive',
              tag: [],
            },
            userContext.account.uid
          ).then((group) => {
            if (
              userContext.account?.uid &&
              userContext.account.email &&
              userContext.account.displayName
            ) {
              setUser({ group: [group] }, userContext.account.uid, {
                merge: true,
              });
              setMember(
                new Member(
                  userContext.account.displayName,
                  userContext.account.photoURL,
                  'inactive',
                  []
                ),
                userContext.account.email,
                group.id
              );
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
          create_group(groupName);
        }}
      >
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
        <BasicButton
          variant="primary"
          type="submit"
          isLoading={isSubmitting}
          w="full"
        >
          作成
        </BasicButton>
      </form>
    </FormControl>
  );
};

export default CreateGroup;
