import React, { useContext, useMemo, useState } from 'react';
import {
  Avatar,
  Box,
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
import { FormButtons } from './assets';

const PersonalSetting: React.FC = () => {
  const { currentId, currentMember, updateCurrentMember } =
    useContext(GroupContext);
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

  const updateMemberContext = () => {
    if (currentMember && currentId)
      getMember(currentMember.id, currentId).then((e) => {
        if (e && updateCurrentMember) updateCurrentMember(e);
      });
  };

  const ProfileImage: React.FC = () =>
    useMemo(
      () => (
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
                    updateMemberContext();
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
      ),
      []
    );

  const [userName, setUserName] = useState<string>();
  const toast = useToast();
  return (
    <Box my="4">
      <Heading size="lg">個人設定</Heading>
      <Stack spacing="2" py="4">
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
          <FormButtons
            editMode={editMode}
            onSave={() => {
              setEditMode.off();
              const _member = Member?.data();
              if (_member && userName && Member && currentId) {
                _member.name = userName;
                setMember(_member, Member.id, currentId, {
                  merge: true,
                })
                  .then(() => {
                    updateMemberContext();
                    toast({
                      status: 'success',
                      title: '保存しました',
                    });
                  })
                  .catch(() => {
                    setUserName(Member.data()?.name);
                    toast({
                      status: 'error',
                      title: '保存できませんでした',
                    });
                  });
              }
            }}
            saveAvailable={
              userName != Member?.data()?.name || !!userName?.length
            }
            onCancel={() => {
              setEditMode.off();
              setUserName(Member?.data()?.name);
            }}
            setEditable={setEditMode.on}
          />
        </HStack>
        <ProfileImage />
      </Stack>
    </Box>
  );
};

const Setting: React.FC = () => {
  const AdminSetting = React.lazy(() => import('./admin-setting'));
  const { isAdmin } = useContext(GroupContext);
  return (
    <>
      <Heading>設定</Heading>
      <Stack spacing="5" py="3">
        <PersonalSetting />
        {isAdmin && <AdminSetting />}
      </Stack>
    </>
  );
};

export default Setting;
