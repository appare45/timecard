import { Button, ButtonGroup } from '@chakra-ui/button';
import { useBoolean, useClipboard } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import {
  Box,
  Heading,
  Text,
  HStack,
  Stack,
  Divider,
  Circle,
} from '@chakra-ui/layout';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Checkbox,
  Editable,
  EditableInput,
  EditablePreview,
  FormControl,
  FormHelperText,
  FormLabel,
  PinInput,
  PinInputField,
  Spacer,
  Table,
  Td,
  Tr,
} from '@chakra-ui/react';
import { Select } from '@chakra-ui/select';
import { Tag as TagElement, TagLabel, TagLeftIcon } from '@chakra-ui/tag';
import { useToast } from '@chakra-ui/toast';
import {
  DocumentSnapshot,
  QueryDocumentSnapshot,
  Timestamp,
} from '@firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { IoAdd, IoCheckmark, IoClipboard, IoKeyOutline } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import {
  Account,
  addAccount,
  addAdmin,
  getGroup,
  Group,
  listAccount,
  setGroup,
} from '../utils/group';
import { createInvite } from '../utils/invite';
import { getMember, listMembers, Member } from '../utils/member';
import { createTag, listTag, tag, tagColors } from './../utils/group-tag';
import { FormButtons, GroupTag } from './assets';

const OrganizationName = () => {
  const { currentGroup } = useContext(GroupContext);
  useMemo(() => {
    if (currentGroup)
      getGroup(currentGroup.id).then((e) => {
        if (e) setCurrentGroupData(e);
        setOrganizationName(e?.data()?.name);
      });
  }, [currentGroup]);
  const [editMode, setEditMode] = useState(false);
  const [currentGroupData, setCurrentGroupData] =
    useState<DocumentSnapshot<Group>>();
  const [organizationName, setOrganizationName] = useState<string>();
  const toast = useToast();
  return (
    <HStack spacing="5">
      <Text wordBreak="keep-all">組織名</Text>
      <Input
        value={organizationName}
        isReadOnly={!editMode}
        onChange={(e) => setOrganizationName(e.target.value)}
      />
      <FormButtons
        onCancel={() => {
          setEditMode(false);
          setOrganizationName(currentGroupData?.data()?.name);
        }}
        editMode={editMode}
        onSave={() => {
          const _group = currentGroupData?.data();

          if (_group && organizationName && currentGroup) {
            _group.name = organizationName;
            setGroup(_group, currentGroup.id)
              .then(() =>
                toast({
                  status: 'success',
                  title: '保存しました',
                })
              )
              .catch(() => {
                setOrganizationName(currentGroupData?.data()?.name);
                toast({
                  status: 'error',
                  title: '保存に失敗しました',
                });
              });
          }
          setEditMode(false);
        }}
        setEditable={() => setEditMode(true)}
        saveAvailable={
          organizationName != currentGroupData?.data()?.name &&
          !!organizationName
        }
      />
    </HStack>
  );
};

const CreateTag = () => {
  const [createMode, setCreateMode] = useBoolean(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState<tagColors>('red');
  const { currentGroup } = useContext(GroupContext);
  const toast = useToast();
  const tagColors: tagColors[] = [
    'gray',
    'red',
    'orange',
    'yellow',
    'green',
    'blue',
    'cyan',
    'purple',
    'pink',
  ];
  return (
    <HStack my="3">
      {createMode ? (
        <>
          <GroupTag
            label={
              <Editable
                placeholder="タグの名前を入力"
                onSubmit={(e) => setTagName(e)}
                startWithEditView>
                <EditableInput />
                <EditablePreview />
              </Editable>
            }
            color={tagColor}
            size="lg"
          />
          <Select
            variant="filled"
            size="sm"
            w="auto"
            iconColor={tagColor}
            value={tagColor}
            onChange={(e) => setTagColor(e.target.value as tagColors)}>
            {tagColors.map((color) => (
              <option key={color} id={color}>
                {color}
              </option>
            ))}
          </Select>
          <Spacer />
          {tagName.length == 0 && (
            <Alert status="warning" w="auto" variant="subtle">
              <AlertIcon />
              タグの名前を入力してください
            </Alert>
          )}
          <ButtonGroup>
            <Button
              colorScheme="green"
              disabled={tagName.length == 0 && tagName.length < 20}
              onClick={() => {
                if (currentGroup && tagName.length > 0)
                  createTag(new tag(tagName, tagColor), currentGroup.id)
                    .then(() => {
                      toast({
                        title: 'タグを作成しました',
                        status: 'success',
                      });
                      setCreateMode.off();
                    })
                    .catch(() => {
                      toast({ title: '作成に失敗しました', status: 'error' });
                    });
              }}>
              作成
            </Button>
            <Button
              variant="ghost"
              colorScheme="red"
              onClick={setCreateMode.off}>
              キャンセル
            </Button>
          </ButtonGroup>
        </>
      ) : (
        <Button
          leftIcon={<IoAdd />}
          variant="outline"
          colorScheme="green"
          onClick={setCreateMode.on}>
          タグを作成
        </Button>
      )}
    </HStack>
  );
};

const TagSetting = () => {
  return (
    <Box>
      <Heading>タグ</Heading>
      <CreateTag />
      <TagList />
    </Box>
  );
};

const TagList = () => {
  const { currentGroup } = useContext(GroupContext);
  const [tags, setTags] = useState<QueryDocumentSnapshot<tag>[]>([]);
  // ToDo: 無限スクロールを実装
  useEffect(() => {
    if (currentGroup)
      listTag(currentGroup.id).then((e) => {
        const tags: QueryDocumentSnapshot<tag>[] = [];
        e.forEach((j) => tags.push(j));

        setTags(tags);
      });
  }, [currentGroup]);
  return tags.length > 0 ? (
    <>
      {tags?.map((e) => (
        <GroupTag
          label={e.data().name ?? '読込中'}
          color={e.data().color ?? 'gray'}
          key={e.id}
          size="lg"
        />
      ))}
    </>
  ) : (
    <Alert status="info">
      <AlertIcon />
      <AlertTitle>タグがありません</AlertTitle>
    </Alert>
  );
};

const CreateInvite = ({
  email,
  isAdmin,
  memberId,
}: {
  email: string;
  isAdmin: boolean;
  memberId: string;
}) => {
  const [code] = useState(Math.random().toString(32).substring(2).slice(0, 6));
  const clipBoard = useClipboard(code);

  const { account } = useContext(AuthContext);
  const { currentGroup } = useContext(GroupContext);

  useEffect(() => {
    if (account?.email && currentGroup && currentGroup)
      createInvite(email, {
        group: [currentGroup.ref],
        authorId: account.uid,
        used: false,
      }).then(() => {
        addAccount(
          email,
          new Account(memberId, false, Timestamp.now()),
          currentGroup.id
        );
        if (isAdmin) addAdmin(email, memberId, currentGroup.id);
      });
  }, [
    account?.email,
    account?.uid,
    code,
    currentGroup,
    email,
    isAdmin,
    memberId,
  ]);
  return (
    <HStack>
      <PinInput type="alphanumeric" value={code} isDisabled>
        <PinInputField />
        <PinInputField />
        <PinInputField />
        <PinInputField />
        <PinInputField />
        <PinInputField />
      </PinInput>
      <Button
        leftIcon={clipBoard.hasCopied ? <IoCheckmark /> : <IoClipboard />}
        colorScheme={clipBoard.hasCopied ? 'green' : undefined}
        variant={clipBoard.hasCopied ? 'outline' : undefined}
        onClick={clipBoard.onCopy}>
        コードをコピー
      </Button>
    </HStack>
  );
};

const InviteElement = () => {
  const [createState, setCreateState] = useBoolean(false);
  const [email, setEmail] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [member, setMember] = useState('');
  const [members, setMembers] = useState<QueryDocumentSnapshot<Member>[]>();

  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup)
      listMembers(currentGroup.id).then((e) => {
        const _members: QueryDocumentSnapshot<Member>[] = [];
        e?.forEach((f) => _members.push(f));
        setMembers(_members);
      });
  }, [currentGroup]);
  return (
    <Box>
      <Heading>招待を作成</Heading>
      {createState ? (
        <CreateInvite email={email} isAdmin={isAdmin} memberId={member} />
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (email.length) setCreateState.on();
          }}>
          <Box>
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
                  }}>
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
              onChange={(e) => setIsAdmin(e.target.checked)}>
              管理者として招待
            </Checkbox>
          </Box>
          <Button colorScheme="green" type="submit">
            作成
          </Button>
        </form>
      )}
    </Box>
  );
};

const AccountList = () => {
  const [accounts, setAccounts] = useState<QueryDocumentSnapshot<Account>[]>(
    []
  );
  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup)
      listAccount(currentGroup.id).then((_accounts) => {
        const __accounts: QueryDocumentSnapshot<Account>[] = [];
        _accounts.forEach((account) => __accounts.push(account));
        setAccounts(__accounts);
        console.info(__accounts);
      });
  }, [currentGroup]);
  return (
    <Box mt="2">
      <Table divider={<Divider />} alignItems="flex-start">
        {accounts.map((account) => (
          <AccountItem account={account} key={account.id} />
        ))}
      </Table>
    </Box>
  );
};

const AccountItem = ({
  account,
}: {
  account: QueryDocumentSnapshot<Account>;
}) => {
  const [member, setMember] = useState<DocumentSnapshot<Member> | null>(null);
  const { currentGroup } = useContext(GroupContext);
  useEffect(() => {
    if (currentGroup)
      getMember(account.data().memberId, currentGroup.id).then(setMember);
  }, [account, currentGroup]);
  return (
    <Tr>
      <Td>{member?.data()?.name}</Td>
      <Td>{account.id}</Td>
      <Td>
        <HStack alignItems="center">
          <Circle
            bgColor={account.data().isActive ? 'green.400' : 'yellow.400'}
            size="3"
          />
          <Text>{account.data().isActive ? 'アクティブ' : '承諾待ち'}</Text>
        </HStack>
      </Td>
    </Tr>
  );
};

const AdminSetting: React.FC = () => {
  return (
    <Box>
      <HStack spacing="4">
        <Heading size="lg">組織設定</Heading>
        <TagElement>
          <TagLeftIcon as={IoKeyOutline} />
          <TagLabel>管理者のみが設定できます</TagLabel>
        </TagElement>
      </HStack>
      <Stack py="4">
        <OrganizationName />
        <TagSetting />
        <InviteElement />
        <AccountList />
      </Stack>
    </Box>
  );
};

export default AdminSetting;
