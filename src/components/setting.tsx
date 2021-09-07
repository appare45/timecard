import React, { useContext, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
  Button,
  ButtonGroup,
  Heading,
  HStack,
  Input,
  Stack,
  Switch,
  Text,
  useBoolean,
  useToast,
} from '@chakra-ui/react';
import { GroupContext } from '../contexts/group';
import { getMember, Member, setMember } from '../utils/group';
import { DocumentSnapshot } from '@firebase/firestore';
import { AuthContext } from '../contexts/user';

const PersonalSetting: React.FC = () => {
  const { currentId, currentMember } = useContext(GroupContext);
  const { account } = useContext(AuthContext);
  const [Member, setCurrentMember] = useState<DocumentSnapshot<Member>>();
  const [editMode, setEditMode] = useBoolean(false);
  const [syncProfile, setSyncProfile] = useState<boolean>(false);
  const [update, setUpdate] = useState<boolean>();

  useMemo(() => {
    console.info(update);
    if (currentId && currentMember)
      getMember(currentMember?.id, currentId).then((_member) => {
        if (_member) setCurrentMember(_member);
        setUserName(_member?.data()?.name);
        setSyncProfile(!!_member?.data()?.photoUrl);
      });
  }, [currentId, currentMember, update]);
  const [userName, setUserName] = useState<string>();
  const toast = useToast();
  return (
    <Box my="4">
      <Heading size="lg">個人設定</Heading>
      <HStack spacing="12">
        <HStack my="4" spacing="3">
          <Avatar src={Member?.data()?.photoUrl} name={userName} />
          <Input
            fontSize="xl"
            value={userName}
            isReadOnly={!editMode}
            variant={editMode ? 'outline' : 'flushed'}
            onChange={(e) => setUserName(e.target.value)}
            isRequired
            min="1"
          />
        </HStack>
        {editMode ? (
          <ButtonGroup>
            <Button
              onClick={() => {
                setEditMode.off();
                const _member = Member?.data();
                if (_member && userName && Member && currentId) {
                  _member.name = userName;
                  setMember(_member, Member.id, currentId, {
                    merge: true,
                  })
                    .then(() =>
                      toast({
                        status: 'success',
                        title: '保存しました',
                      })
                    )
                    .catch(() => {
                      setUserName(Member.data()?.name);
                      toast({
                        status: 'error',
                        title: '保存できませんでした',
                      });
                    });
                }
              }}
              colorScheme="green"
              isDisabled={
                userName == Member?.data()?.name || !userName?.length
              }>
              保存
            </Button>
            <Button
              onClick={() => {
                setEditMode.off();
                setUserName(Member?.data()?.name);
              }}
              variant="ghost"
              colorScheme="red">
              キャンセル
            </Button>
          </ButtonGroup>
        ) : (
          <Button
            onClick={setEditMode.on}
            variant="outline"
            colorScheme="green">
            編集
          </Button>
        )}
      </HStack>
      <HStack spacing="5">
        <Stack spacing="0.5">
          <Text fontSize="lg">
            プロフィール画像をGoogleアカウントと同期する
          </Text>
          <Text fontSize="sm">
            Googleアカウントのプロフィール画像がアイコンに設定されます
          </Text>
        </Stack>
        <Switch
          colorScheme="green"
          defaultChecked={!!Member?.data()?.photoUrl}
          isChecked={syncProfile}
          onChange={() => {
            const _member = Member?.data();
            if (_member && Member && currentId) {
              _member.photoUrl = !syncProfile ? account?.photoURL ?? '' : '';
              setMember(_member, Member?.id, currentId)
                .then(() => {
                  setUpdate(!update);
                  toast({
                    status: 'success',
                    title: '保存しました',
                  });
                  setSyncProfile(!syncProfile);
                })
                .catch(() => {
                  toast({
                    status: 'error',
                    title: '保存に失敗しました',
                  });
                });
            }
          }}
        />
      </HStack>
    </Box>
  );
};

const Setting: React.FC = () => {
  return (
    <>
      <Heading>設定</Heading>
      <PersonalSetting />
    </>
  );
};

export default Setting;
