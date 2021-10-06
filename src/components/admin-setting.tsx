import { Button, ButtonGroup } from '@chakra-ui/button';
import { useBoolean } from '@chakra-ui/hooks';
import { Input } from '@chakra-ui/input';
import { Box, Heading, Text, HStack, Stack } from '@chakra-ui/layout';
import {
  Alert,
  AlertIcon,
  AlertTitle,
  Editable,
  EditableInput,
  EditablePreview,
  Spacer,
  Tag,
} from '@chakra-ui/react';
import { Select } from '@chakra-ui/select';
import { Tag as TagElement, TagLabel, TagLeftIcon } from '@chakra-ui/tag';
import { useToast } from '@chakra-ui/toast';
import { QueryDocumentSnapshot } from '@firebase/firestore';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { IoAdd, IoKeyOutline, IoPricetag } from 'react-icons/io5';
import { GroupContext } from '../contexts/group';
import { getGroup, Group, setGroup } from '../utils/group';
import { createTag, listTag, tag, tagColors } from './../utils/group-tag';
import { FormButtons } from './assets';

const OrganizationName = () => {
  const { currentId } = useContext(GroupContext);
  useMemo(() => {
    if (currentId)
      getGroup(currentId).then((e) => {
        if (e) setCurrentGroup(e);
        setOrganizationName(e?.name);
      });
  }, [currentId]);
  const [editMode, setEditMode] = useState(false);
  const [currentGroup, setCurrentGroup] = useState<Group>();
  const [organizationName, setOrganizationName] = useState(currentGroup?.name);
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
          setOrganizationName(currentGroup?.name);
        }}
        editMode={editMode}
        onSave={() => {
          const _group = currentGroup;

          if (_group && organizationName && currentId) {
            _group.name = organizationName;
            setGroup(_group, currentId)
              .then(() =>
                toast({
                  status: 'success',
                  title: '保存しました',
                })
              )
              .catch(() => {
                setOrganizationName(currentGroup?.name);
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
          organizationName != currentGroup?.name && !!organizationName
        }
      />
    </HStack>
  );
};

const CreateTag = () => {
  const [createMode, setCreateMode] = useBoolean(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState<tagColors>('red');
  const { currentId } = useContext(GroupContext);
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
          <Tag colorScheme={tagColor} size="lg">
            <TagLeftIcon as={IoPricetag} />
            <TagLabel>
              <Editable
                placeholder="タグの名前を入力"
                onSubmit={(e) => setTagName(e)}
                startWithEditView>
                <EditableInput />
                <EditablePreview />
              </Editable>
            </TagLabel>
          </Tag>
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
                if (currentId && tagName.length > 0)
                  createTag(new tag(tagName, tagColor), currentId)
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
  const { currentId } = useContext(GroupContext);
  const [tags, setTags] = useState<QueryDocumentSnapshot<tag>[]>();
  useEffect(() => {
    if (currentId)
      listTag(currentId).then((e) => {
        const tags: QueryDocumentSnapshot<tag>[] = [];
        e.forEach((j) => tags.push(j));
        setTags(tags);
      });
  }, [currentId]);
  return tags?.length ?? 0 > 0 ? (
    <></>
  ) : (
    <Alert status="info">
      <AlertIcon />
      <AlertTitle>タグがありません</AlertTitle>
    </Alert>
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
      </Stack>
    </Box>
  );
};

export default AdminSetting;
