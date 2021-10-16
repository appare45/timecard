import { HStack, Stack } from '@chakra-ui/layout';
import {
  Skeleton,
  Table,
  Thead,
  Tr,
  Th,
  Tbody,
  Text,
  Tooltip,
  Switch,
  Td,
  Alert,
  AlertIcon,
  VStack,
  ButtonGroup,
  IconButton,
  Editable,
  EditableInput,
  EditablePreview,
  useToast,
  Button,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverHeader,
  PopoverBody,
  Checkbox,
} from '@chakra-ui/react';
import React, {
  useContext,
  useState,
  useEffect,
  ReactElement,
  useMemo,
  useCallback,
} from 'react';
import { IoAdd, IoAnalytics } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { Link as RouterLink } from 'react-router-dom';
import {
  DocumentReference,
  DocumentSnapshot,
  getDoc,
  QueryDocumentSnapshot,
} from '@firebase/firestore';
import { GroupTag, LoadMoreButton, MemberAvatar } from './assets';
import { listTag, tag } from '../utils/group-tag';
import { listMembers, Member, setMember, setMemberTag } from '../utils/member';
import { atom, useRecoilState } from 'recoil';

const MemberName: React.FC<{ data: QueryDocumentSnapshot<Member> }> = ({
  data,
}) => {
  const { currentId } = useContext(GroupContext);
  const toast = useToast();
  return (
    <Editable
      defaultValue={data.data().name}
      onSubmit={(e) => {
        const _member = data.data();
        _member.name = e;
        if (currentId)
          setMember(_member, data.id, currentId, { merge: true })
            .then(() =>
              toast({
                title: '保存しました',
                status: 'success',
              })
            )
            .catch(() =>
              toast({
                title: '保存に失敗しました',
                status: 'error',
              })
            );
      }}>
      <EditablePreview />
      <EditableInput />
    </Editable>
  );
};

const GroupTagList: React.FC<{
  groupTags: DocumentSnapshot<tag>[];
  userTags: {
    data: DocumentSnapshot<tag>[];
    addTag: (e: DocumentSnapshot<tag>) => void;
    removeTag: (e: DocumentSnapshot<tag>) => void;
  };
}> = ({ groupTags, userTags }) => {
  return useMemo(() => {
    // 各タグ
    const GroupTagMemo: React.FC<{ tag: DocumentSnapshot<tag> }> = ({ tag }) =>
      useMemo(() => {
        const tagData = tag.data();
        if (tagData) {
          return (
            <Checkbox
              defaultChecked={
                userTags.data.find((e) => e.id === tag.id) != undefined
              }
              onChange={(e) => {
                if (e.target.checked) {
                  userTags.addTag(tag);
                } else {
                  userTags.removeTag(tag);
                }
              }}>
              <GroupTag label={tagData.name} color={tagData.color} />
            </Checkbox>
          );
        } else return null;
      }, [tag]);

    return (
      <Stack spacing="2">
        {groupTags.map((tag) => (
          <GroupTagMemo tag={tag} key={tag.id} />
        ))}
      </Stack>
    );
  }, [groupTags, userTags]);
};

const MemberTags: React.FC<{ memberId: string; memberData: Member }> = ({
  memberId,
  memberData,
}) => {
  // ユーザーが持つタグ
  const [userTags, setUserTags] = useState<DocumentSnapshot<tag>[]>([]);

  // グループのタグ
  const [groupTags, setGroupTags] = useState<DocumentSnapshot<tag>[]>([]);
  const { currentId } = useContext(GroupContext);
  useMemo(() => {
    if (currentId) {
      // タグ一覧を取得
      listTag(currentId).then((e) => {
        e.forEach((f) => {
          setGroupTags((oldTags) => [...oldTags, f]);
        });
      });
    }
  }, [currentId]);

  const addTag = useCallback(
    (tag: DocumentSnapshot<tag>) => {
      setUserTags((e) => {
        const newMemberTag = [...e, tag];
        const newMemberTagRef: DocumentReference<tag>[] = newMemberTag.map(
          (e) => e.ref
        );
        if (currentId) {
          setMemberTag(newMemberTagRef, memberId, currentId);
        }
        return newMemberTag;
      });
    },
    [currentId, memberId]
  );

  useEffect(() => {
    const tagSnapshots: DocumentSnapshot<tag>[] = [];
    Promise.all(
      memberData.tag.map(
        (tagRef): Promise<number> =>
          getDoc(tagRef).then((e) => tagSnapshots.push(e))
      )
    ).then(() => {
      setUserTags(tagSnapshots);
    });
  }, [memberData]);

  const removeTag = (tag: DocumentSnapshot<tag>) => {
    const removeTagIndex = userTags.findIndex((e) => e.id === tag.id);
    const newTags = [
      ...userTags.slice(0, removeTagIndex),
      ...userTags.slice(removeTagIndex + 1),
    ];
    const newTagsRef = newTags.map((e) => e.ref);
    if (currentId) {
      setMemberTag(newTagsRef, memberId, currentId);
    }
    setUserTags(newTags);
  };

  //  タグを追加するボタン（popover）
  const AddTagButton: React.FC = () => {
    return (
      <Popover isLazy lazyBehavior="keepMounted">
        <PopoverTrigger>
          <Button leftIcon={<IoAdd />} variant="outline" size="sm">
            タグを追加
          </Button>
        </PopoverTrigger>
        <PopoverContent w="auto">
          <PopoverArrow />
          <PopoverCloseButton />
          <PopoverHeader>タグを選択</PopoverHeader>
          <PopoverBody>
            <GroupTagList
              groupTags={groupTags}
              userTags={{
                data: userTags,
                addTag: addTag,
                removeTag: removeTag,
              }}
            />
          </PopoverBody>
        </PopoverContent>
      </Popover>
    );
  };

  return (
    <HStack>
      {userTags.map((tag) => (
        <GroupTag
          label={tag.data()?.name ?? ''}
          color={tag.data()?.color ?? 'gray'}
          key={tag.id}
          onRemove={() => removeTag(tag)}
          size="md"
        />
      ))}
      <AddTagButton />
    </HStack>
  );
};

const MemberRow: React.FC<{
  data: QueryDocumentSnapshot<Member>;
  buttons: ReactElement;
  isSimple?: boolean;
}> = ({ data, buttons, isSimple = false }) => (
  <>
    {data.data() && (
      <Tr>
        <Td>
          <HStack>
            <MemberAvatar
              member={data.data()}
              size={isSimple ? 'xs' : undefined}
              status={true}
            />
            <MemberName data={data} />
          </HStack>
        </Td>
        {!isSimple && (
          <>
            <Td>
              <HStack>{buttons}</HStack>
            </Td>
            <Td>
              <MemberTags memberId={data.id} memberData={data.data()} />
            </Td>
          </>
        )}
      </Tr>
    )}
  </>
);

const MembersListTable: React.FC<{
  membersData: QueryDocumentSnapshot<Member>[];
  isSimple?: boolean;
}> = ({ membersData, isSimple = false }) => {
  return useMemo(
    () => (
      <>
        {membersData?.map((member) => (
          <MemberRow
            key={member.id}
            data={member}
            isSimple={isSimple}
            buttons={
              <ButtonGroup colorScheme="gray" variant="ghost" spacing="1">
                <Tooltip label="アクティビティーを見る">
                  <IconButton
                    aria-label="アクティビティーを見る"
                    icon={<IoAnalytics />}
                    as={RouterLink}
                    to={`/member/${member.id}`}
                  />
                </Tooltip>
              </ButtonGroup>
            }
          />
        ))}
      </>
    ),
    [isSimple, membersData]
  );
};

// メンバー一覧のatom
const ShowMembersState = atom<QueryDocumentSnapshot<Member>[]>({
  key: 'shownMemberState_MembersList',
  default: [],
  dangerouslyAllowMutability: true,
});

const MembersList: React.FC<{
  onlyOnline?: boolean;
  update?: boolean;
  isSimple?: boolean;
}> = ({ onlyOnline = false, update, isSimple = false }) => {
  const { currentId } = useContext(GroupContext);
  const [isUpdating, setIsUpdating] = useState(true);
  const [shownMembers, setShownMembers] = useRecoilState(ShowMembersState);
  const [sortWithOnline, setSortWithOnline] = useState(onlyOnline);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot>();

  const loadDataCount = 10;

  const loadMoreData = (startFrom: QueryDocumentSnapshot) => {
    if (currentId)
      listMembers(
        currentId,
        loadDataCount,
        undefined,
        sortWithOnline ? 'active' : undefined,
        startFrom
      ).then((members) => {
        const membersList: QueryDocumentSnapshot<Member>[] = [];
        members?.forEach((_) => membersList.push(_));
        setLastDoc(membersList[loadDataCount - 1] ?? null);
        setShownMembers((e) => [...(e ?? []), ...membersList]);
      });
  };

  useEffect(() => {
    console.info(update);
    setIsUpdating(true);
    if (currentId) {
      listMembers(
        currentId,
        loadDataCount,
        undefined,
        sortWithOnline ? 'active' : undefined
      ).then((members) => {
        if (members) {
          const _members: QueryDocumentSnapshot<Member>[] = [];
          members.forEach((member) => {
            _members.push(member);
          });
          setLastDoc(_members[loadDataCount - 1] ?? null);
          setShownMembers(_members);
        }
        setIsUpdating(false);
      });

      setIsUpdating(false);
    }
  }, [currentId, setShownMembers, sortWithOnline, update]);
  return (
    <>
      {!onlyOnline && (
        <HStack spacing="2" p="1" my="2" w="full">
          <Text>進行中のみ表示</Text>
          <Switch
            isChecked={sortWithOnline}
            onChange={() => {
              setSortWithOnline(!sortWithOnline);
            }}
            colorScheme="green"
          />
        </HStack>
      )}
      {shownMembers?.length == 0 ? (
        <Alert>
          <AlertIcon />
          {sortWithOnline
            ? 'オンラインのメンバーがいません'
            : '表示するメンバーがいません'}
        </Alert>
      ) : (
        <Skeleton isLoaded={!isUpdating} w="full">
          <VStack spacing="4">
            <Table
              colorScheme="blackAlpha"
              size={isSimple ? 'sm' : 'md'}
              mt={!isSimple ? '5' : '0.5'}
              w="full">
              <Thead>
                <Tr>
                  <Th>名前</Th>
                  <Th></Th>
                  <Th>タグ</Th>
                </Tr>
              </Thead>
              <Tbody>
                {shownMembers && (
                  <MembersListTable membersData={shownMembers} />
                )}
              </Tbody>
            </Table>
            {lastDoc && (
              <LoadMoreButton loadMore={() => loadMoreData(lastDoc)} />
            )}
          </VStack>
        </Skeleton>
      )}
    </>
  );
};

export default MembersList;
