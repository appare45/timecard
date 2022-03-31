import { Input } from '@chakra-ui/input';
import { Select } from '@chakra-ui/select';
import React from 'react';
import {
  FormControl,
  FormLabel,
  FormHelperText,
} from '@chakra-ui/form-control';
import { Checkbox } from '@chakra-ui/checkbox';
import { QueryDocumentSnapshot, Timestamp } from '@firebase/firestore';
import { useContext, useEffect, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { listMembers, Member } from '../utils/member';
import { BasicButton } from './buttons';
import { AuthContext } from '../contexts/user';
import { addAccount, Account, addAdmin } from '../utils/group';
import { createInvite } from '../utils/invite';
import {
  ModalFooter,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
} from '@chakra-ui/modal';

export const InviteElement: React.FC<{
  onSuccess: () => unknown;
}> = ({ onSuccess }): JSX.Element => {
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [member, setMember] = useState('');
  const [members, setMembers] = useState<QueryDocumentSnapshot<Member>[]>();
  const { account } = useContext(AuthContext);
  const { currentGroup } = useContext(GroupContext);

  useEffect(() => {
    if (currentGroup)
      listMembers(currentGroup.id).then((e) => {
        const _members: QueryDocumentSnapshot<Member>[] = [];
        e?.forEach((f) => _members.push(f));
        setMembers(_members);
        setMember(_members[0].id ?? '');
      });
  }, [currentGroup]);
  return (
    <>
      <ModalHeader>招待</ModalHeader>
      <ModalCloseButton />
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          if (email.length) {
            if (account?.email && currentGroup && currentGroup)
              createInvite(email, {
                group: [currentGroup.ref],
                authorId: account.uid,
                used: false,
              }).then(async () => {
                await addAccount(
                  email,
                  new Account(member, false, Timestamp.now()),
                  currentGroup.id
                );
                if (isAdmin) await addAdmin(email, member, currentGroup.id);
                onSuccess();
              });
          }
        }}
      >
        <ModalBody>
          <FormControl isRequired>
            <FormLabel>メールアドレス</FormLabel>
            <Input
              value={email}
              type="email"
              onChange={(e) => setEmail(e.target.value)}
            />
            <FormHelperText>
              招待する人のメールアドレスを入力してください
            </FormHelperText>
          </FormControl>
          <FormControl isRequired>
            <FormLabel>関連付けるメンバー</FormLabel>
            {members && (
              <Select
                onChange={(e) => {
                  setMember(members[e.target.selectedIndex].id);
                }}
              >
                {members.map((_member) => (
                  <option id={_member.id} key={_member.id}>
                    {_member.data().name}
                  </option>
                ))}
              </Select>
            )}
            <FormHelperText>招待するメンバーを選んでください</FormHelperText>
          </FormControl>
          <Checkbox
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
          >
            管理者として招待
          </Checkbox>
        </ModalBody>
        <ModalFooter>
          <BasicButton variant="primary" type="submit" mt="2" size="sm">
            招待
          </BasicButton>
        </ModalFooter>
      </form>
    </>
  );
};

export default InviteElement;
