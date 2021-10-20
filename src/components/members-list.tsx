import { Box, Grid, HStack, Spacer } from '@chakra-ui/layout';
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
  Select,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
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
import {
  atom,
  selectorFamily,
  useRecoilState,
  useRecoilValue,
  useSetRecoilState,
} from 'recoil';
import { GroupTagList } from './group-tag-control';
import Card, { cardWidth } from './createCard';

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
          setMember(_member, data.id, currentId, { merge: true }).catch(() =>
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

const MemberTags: React.FC<{ memberId: string; memberData: Member }> = ({
  memberId,
  memberData,
}) => {
  // ユーザーが持つタグ
  const [userTags, setUserTags] = useState<DocumentSnapshot<tag>[]>([]);
  const { currentId } = useContext(GroupContext);

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
      <Box>
        <Popover isLazy lazyBehavior="keepMounted">
          <PopoverTrigger>
            <Button leftIcon={<IoAdd />} variant="outline" size="xs">
              タグを追加
            </Button>
          </PopoverTrigger>
          <PopoverContent w="auto">
            <PopoverArrow />
            <PopoverCloseButton />
            <PopoverHeader>タグを選択</PopoverHeader>
            <PopoverBody>
              <GroupTagList
                userTags={{
                  ids: userTags.map((e) => e.id),
                  addTag: addTag,
                  removeTag: removeTag,
                }}
              />
            </PopoverBody>
          </PopoverContent>
        </Popover>
      </Box>
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
          size="sm"
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

const MembersListCard: React.FC<{
  membersData: QueryDocumentSnapshot<Member>[];
}> = ({ membersData }) => {
  const { currentGroup } = useContext(GroupContext);
  return (
    <Grid
      templateColumns={`repeat( auto-fit, minmax(${cardWidth}mm, 1fr))`}
      gap="4">
      {currentGroup &&
        membersData.map((member) => (
          <Box key={member.id}>
            <Card
              member={{ data: member.data(), id: member.id }}
              group={currentGroup}
            />
          </Box>
        ))}
    </Grid>
  );
};

// メンバー一覧のatom
const ShowMembersState = atom<QueryDocumentSnapshot<Member>[]>({
  key: 'shownMemberState_MembersList',
  default: [],
  dangerouslyAllowMutability: true,
});

const ShowMemberOnlineState = atom<boolean>({
  key: 'showMemberOnlineState',
  default: false,
});

const showMemberFilterState = atom<QueryDocumentSnapshot<tag> | null>({
  key: 'showMemberFilterState',
  default: null,
  dangerouslyAllowMutability: true,
});

const filteredMemberFilterState = selectorFamily<
  QueryDocumentSnapshot<Member>[],
  { groupId: string; count: number }
>({
  key: 'filteredMemberState',
  get:
    ({ groupId, count }) =>
    async ({ get }): Promise<QueryDocumentSnapshot<Member>[]> => {
      const filter = get(showMemberFilterState);
      const Members = get(ShowMembersState);
      const OnlyOnline = get(ShowMemberOnlineState);
      const filteredResult = await listMembers(
        groupId,
        count,
        undefined,
        OnlyOnline ? 'active' : undefined,
        Members[count],
        filter?.ref ?? undefined
      );
      const newMembers: QueryDocumentSnapshot<Member>[] = [];
      filteredResult?.forEach((e) => newMembers.push(e));
      return newMembers;
    },
  dangerouslyAllowMutability: true,
});

const MembersList: React.FC<{
  onlyOnline?: boolean;
  isSimple?: boolean;
}> = ({ onlyOnline = false, isSimple = false }) => {
  const loadDataCount = 10;
  const { currentId } = useContext(GroupContext);
  const setShownMembers = useSetRecoilState(ShowMembersState);
  const shownMembers = useRecoilValue(
    filteredMemberFilterState({
      groupId: currentId ?? '',
      count: loadDataCount,
    })
  );
  const [sortWithOnline, setSortWithOnline] = useRecoilState(
    ShowMemberOnlineState
  );
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot>();

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

  useEffect(
    () => setSortWithOnline(onlyOnline),
    [onlyOnline, setSortWithOnline]
  );

  const MemoedMemberFilter = () => useMemo(() => <MemberFilter />, []);
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
          <Spacer />
          <MemoedMemberFilter />
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
        <Skeleton isLoaded={!!shownMembers.length} w="full">
          <Tabs
            variant="soft-rounded"
            colorScheme="gray"
            isLazy
            lazyBehavior="keepMounted">
            <TabList>
              <Tab>表</Tab>
              <Tab>カード</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <VStack spacing="4">
                  <Table
                    colorScheme="blackAlpha"
                    size={isSimple ? 'sm' : 'md'}
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
              </TabPanel>
              <TabPanel>
                {shownMembers && <MembersListCard membersData={shownMembers} />}
              </TabPanel>
            </TabPanels>
          </Tabs>
        </Skeleton>
      )}
    </>
  );
};

const MemberFilter = () => {
  const [groupTags, setGroupTags] = useState<QueryDocumentSnapshot<tag>[]>([]);
  const { currentId } = useContext(GroupContext);
  useEffect(() => {
    if (currentId) {
      listTag(currentId).then((e) =>
        e.forEach((f) => {
          setGroupTags((oldTags) => [...oldTags, f]);
        })
      );
    }
  }, [currentId]);

  const [currentFilter, setFilter] = useRecoilState(showMemberFilterState);
  return (
    <Select
      w="md"
      onChange={(e) => {
        setFilter(groupTags.find((tag) => tag.id == e.target.value) ?? null);
      }}
      value={currentFilter?.id ?? 'default'}>
      <option value="default">フィルターを選択</option>
      {groupTags.map((e) => (
        <option key={e.id} value={e.id}>
          {e.data().name}
        </option>
      ))}
    </Select>
  );
};

export default MembersList;
