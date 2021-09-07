import { Button, ButtonGroup } from '@chakra-ui/button';
import React from 'react';
import { IoArrowDown } from 'react-icons/io5';

export const LoadMoreButton: React.FC<{ loadMore: () => void }> = ({
  loadMore,
}) => {
  return (
    <Button onClick={loadMore} variant="link" leftIcon={<IoArrowDown />}>
      さらに読み込む
    </Button>
  );
};

export const FormButtons: React.FC<{
  editMode: boolean;
  setEditable: () => void;
  onCancel: () => void;
  onSave: () => void;
  saveAvailable?: boolean;
}> = ({ editMode, onCancel, onSave, setEditable, saveAvailable = true }) => (
  <ButtonGroup colorScheme="green">
    {editMode ? (
      <>
        <Button isDisabled={!saveAvailable} onClick={onSave}>
          保存
        </Button>
        <Button onClick={onCancel} variant="ghost" colorScheme="red">
          キャンセル
        </Button>
      </>
    ) : (
      <Button colorScheme="green" variant="outline" onClick={setEditable}>
        編集
      </Button>
    )}
  </ButtonGroup>
);
