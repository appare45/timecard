import React, { useContext, useMemo, useState } from 'react';
import {
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
import { getMember, Member, setMember } from '../utils/member';
import { DocumentSnapshot } from '@firebase/firestore';
import { AuthContext } from '../contexts/user';
import { FormButtons, MemberAvatar } from '../components/assets';
import { GroupTemplate } from '../templates/group';

const PersonalSetting: React.FC = () => {
  const { currentGroup, currentMember, updateCurrentMember } =
    useContext(GroupContext);
  const { account } = useContext(AuthContext);
  const [Member, setCurrentMember] = useState<DocumentSnapshot<Member>>();
  const [editMode, setEditMode] = useBoolean(false);
  const [syncProfile, setSyncProfile] = useState<boolean>(false);
  const [update, setUpdate] = useState<boolean>();

  useMemo(() => {
    console.info(update);
    if (currentGroup && currentMember)
      getMember(currentMember?.id, currentGroup.id).then((_member) => {
        if (_member) setCurrentMember(_member);
        setUserName(_member?.data()?.name);
        setSyncProfile(!!_member?.data()?.photoUrl);
      });
  }, [currentGroup, currentMember, update]);

  const updateMemberContext = () => {
    if (currentMember && currentGroup)
      getMember(currentMember.id, currentGroup.id).then((e) => {
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
              if (_member && Member && currentGroup) {
                _member.photoUrl = !syncProfile ? account?.photoURL ?? '' : '';
                setMember(_member, Member?.id, currentGroup.id)
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
            {Member?.data() && <MemberAvatar member={Member.data()} />}
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
              if (_member && userName && Member && currentGroup) {
                _member.name = userName;
                setMember(_member, Member.id, currentGroup.id, {
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
  const AdminSetting = React.lazy(() => import('../components/admin-setting'));
  const { isAdmin } = useContext(GroupContext);
  return (
    <GroupTemplate title="設定">
      <Stack spacing="5" py="3">
        <PersonalSetting />
        {isAdmin && <AdminSetting />}
      </Stack>
    </GroupTemplate>
  );
};

export default Setting;
