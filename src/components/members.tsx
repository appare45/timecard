import { Heading, Table, Tbody, Td, Th, Thead, Tr } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { GroupContext } from '../contexts/group';
import { listMembers, Member } from '../utils/group';
import { dataWithId } from '../utils/firebase';
const MembersList: React.FC = () => {
  const groupContext = useContext(GroupContext);
  const [members, setMembers] = useState<dataWithId<Member>[]>();
  useEffect(() => {
    if (groupContext.currentId) {
      listMembers(groupContext.currentId).then((members) => {
        if (members) {
          const _members: dataWithId<Member>[] = [];
          members.forEach((member) => {
            _members.push({ id: member.id, data: member.data() });
          });
          setMembers(_members);
          console.info(_members);
        }
      });
    }
  }, [groupContext.currentId]);
  return (
    <>
      <Heading>メンバー一覧</Heading>
      <Table>
        <Thead>
          <Tr>
            <Th>名前</Th>
          </Tr>
        </Thead>
        <Tbody>
          {members?.map((member) => (
            <Tr key={member.id}>
              <Td>{member.data.name}</Td>
            </Tr>
          ))}
        </Tbody>
      </Table>
    </>
  );
};

export { MembersList };
