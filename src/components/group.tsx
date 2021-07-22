import {
  Button,
  FormControl,
  FormHelperText,
  FormLabel,
  Heading,
  Input,
  Text,
} from '@chakra-ui/react';
import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { createGroup } from '../utils/group';

type groupProps = {
  groupIds: string[];
  children: JSX.Element;
};

const CreateGroup: React.FC = () => {
  const [groupName, setGroupName] = useState('');
  return (
    <FormControl isRequired>
      <FormLabel>グループ名</FormLabel>
      <Input
        minLength={1}
        maxLength={20}
        value={groupName}
        onChange={(e) => {
          if (e.target.value.length <= 20) {
            setGroupName(e.target.value);
          }
        }}
      />
      <FormHelperText>
        グループ名は1文字以上20文字以内で入力してください
      </FormHelperText>
      <Button type="submit">作成</Button>
    </FormControl>
  );
};

const Group: React.FC<groupProps> = ({ groupIds, children }) => {
  return (
    <>
      {groupIds.length ? (
        <>
          <ul>
            {groupIds.map((group) => (
              <li key={group}>{group}</li>
            ))}
          </ul>
          {children}
        </>
      ) : (
        <>
          <Heading>グループの作成</Heading>
          <section>
            <Text>現在では既存のグループに参加することはできません。</Text>
            <Text>将来的に対応予定なのでしばらくお待ちください</Text>
          </section>
          <CreateGroup />
        </>
      )}
    </>
  );
};

export default Group;
