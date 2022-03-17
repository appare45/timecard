import {
  ButtonGroup,
  Circle,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Text,
  Textarea,
  useToast,
} from '@chakra-ui/react';
import React, { Suspense } from 'react';
import { useContext } from 'react';
import { useState } from 'react';
import { GroupContext } from '../contexts/group';
import {
  activity,
  setWork,
  statusToText,
  work,
  workStatus,
} from '../utils/group';
import { IoCreateOutline, IoPencilOutline } from 'react-icons/io5';
import { useMemo } from 'react';
import { DocumentSnapshot } from 'firebase/firestore';
import { LoadingScreen } from './assets';
import { BasicButton, CancelButton } from './buttons';

export const ActivityStatus: React.FC<{
  workStatus: workStatus;
  size?: string | number;
}> = ({ workStatus, size = '3' }) => {
  return (
    <HStack spacing="1">
      <Circle
        bg={workStatus === 'done' ? 'gray.400' : 'green.400'}
        size={size}
      />
      <Text> {statusToText(workStatus ?? '')}</Text>
    </HStack>
  );
};

export const ActivityMemo: React.FC<{
  editable: boolean;
  activity: DocumentSnapshot<activity<work>>;
}> = ({ editable, activity }) => {
  const { currentGroup } = useContext(GroupContext);
  const [draftText, setDraftText] = useState(
    activity.data()?.content.memo.replace(/\\n/g, '\n') ?? ''
  );
  const [editMode, setEditMode] = useState(false);
  const toast = useToast();
  const saveMemo = (groupId: string, workId: string): Promise<void> => {
    const _activity = activity.data();
    if (_activity?.content) _activity.content.memo = draftText;
    if (_activity) {
      return setWork(groupId, workId, _activity, { merge: true });
    } else {
      throw new Error();
    }
  };
  const RenderedMemo = useMemo(() => {
    const ReactMarkdown = React.lazy(() => import('./activity-memo'));
    return (
      <Suspense fallback={<LoadingScreen />}>
        {draftText.length ? (
          <ReactMarkdown draftText={draftText} />
        ) : (
          <Text> メモはありません</Text>
        )}
      </Suspense>
    );
  }, [draftText]);
  return (
    <FormControl my="2">
      <FormLabel>メモ</FormLabel>
      {editMode ? (
        <>
          <Textarea
            autoFocus
            variant="filled"
            disabled={!editMode}
            placeholder="活動の記録を残しましょう（組織内に公開されます）"
            onChange={(e) => setDraftText(e.target.value)}
            maxLength={10000}
            isInvalid={draftText.length > 10000}
            defaultValue={draftText}
            fontSize="md"
            fontFamily="monospace"
            lineHeight="4"
            h="52"
          />
          <FormHelperText>組織内に公開されます</FormHelperText>
        </>
      ) : (
        RenderedMemo
      )}
      {editable && (
        <ButtonGroup my="2">
          {!editMode ? (
            <BasicButton
              onClick={() => setEditMode(true)}
              variant={!draftText.length ? 'secondary' : 'primary'}
              leftIcon={
                !draftText.length ? <IoCreateOutline /> : <IoPencilOutline />
              }
            >
              {draftText.length ? '編集' : '作成'}
            </BasicButton>
          ) : (
            <>
              <BasicButton
                variant="primary"
                isDisabled={
                  draftText === activity.data()?.content.memo &&
                  draftText.length < 10000
                }
                onClick={() => {
                  if (currentGroup)
                    saveMemo(currentGroup.id, activity.id)
                      ?.then(() => {
                        toast({
                          title: '保存しました',
                          status: 'success',
                        });
                        setEditMode(false);
                      })
                      .catch(() => {
                        toast({
                          title: '保存できませんでした',
                          status: 'error',
                        });
                      });
                }}
              >
                保存
              </BasicButton>
              <CancelButton
                variant="secondary"
                colorScheme="red"
                onClick={() => setEditMode(false)}
              >
                キャンセル
              </CancelButton>
            </>
          )}
        </ButtonGroup>
      )}
    </FormControl>
  );
};
