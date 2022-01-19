import React, { Suspense, useContext, useMemo, useState } from 'react';
import {
  Box,
  Heading,
  HStack,
  Input,
  Skeleton,
  SkeletonCircle,
  Stack,
  Switch,
  Text,
  useBoolean,
} from '@chakra-ui/react';
import { GroupContext } from '../contexts/group';
import { getMember, Member, setMember } from '../utils/member';
import { DocumentSnapshot } from '@firebase/firestore';
import { AuthContext } from '../contexts/user';
import { FormButtons, LoadingScreen, MemberAvatar } from '../components/assets';
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
          <Skeleton isLoaded={!!Member?.data()}>
            <Switch
              colorScheme="green"
              defaultChecked={!!Member?.data()?.photoUrl}
              isChecked={syncProfile}
              onChange={() => {
                const _member = Member?.data();
                if (_member && Member && currentGroup) {
                  _member.photoUrl = !syncProfile
                    ? account?.photoURL ?? ''
                    : '';
                  setMember(_member, Member?.id, currentGroup.id).then(() => {
                    setUpdate(!update);
                    updateMemberContext();
                    setSyncProfile(!syncProfile);
                  });
                }
              }}
            />
          </Skeleton>
        </HStack>
      ),
      []
    );

  const [userName, setUserName] = useState<string>();
  return (
    <Box my="4">
      <Heading size="lg">個人設定</Heading>
      <Stack spacing="2" py="4">
        <HStack spacing="12">
          <HStack my="4" spacing="3">
            <SkeletonCircle isLoaded={!!Member?.data}>
              {Member?.data() && <MemberAvatar member={Member.data()} />}
            </SkeletonCircle>
            <Skeleton isLoaded={Member?.data() != undefined} w="50">
              <Input
                fontSize="xl"
                value={userName}
                isReadOnly={!editMode}
                variant={editMode ? 'outline' : 'flushed'}
                onChange={(e) => setUserName(e.target.value)}
                isRequired
                min="1"
              />
            </Skeleton>
          </HStack>
          <FormButtons
            editMode={editMode}
            isDisable={!Member?.data()}
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
                  })
                  .catch(() => {
                    setUserName(Member.data()?.name);
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
        <Suspense fallback={<LoadingScreen />}>
          {isAdmin && <AdminSetting />}
        </Suspense>
      </Stack>
    </GroupTemplate>
  );
};

export default Setting;
