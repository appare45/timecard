import { PinInput, PinInputField } from '@chakra-ui/react';
import React, { useContext, useEffect, useState } from 'react';
import { useHistory } from 'react-router';
import { GroupContext } from '../contexts/group';
import { AuthContext } from '../contexts/user';
import { getInvite } from '../utils/invite';
import { setUser } from '../utils/user';

const JoinGroup: React.FC = () => {
  const [code, setCode] = useState<string>();
  const [isVerifying, setIsVerifying] = useState(false);
  const { currentId } = useContext(GroupContext);
  const Auth = useContext(AuthContext);
  const history = useHistory();
  useEffect(() => {
    if (code?.length === 6) {
      setIsVerifying(true);
      getInvite(code)
        .then((invite) => {
          const groupId = invite.data()?.groupId;
          console.info(groupId);
          if (groupId && Auth.account?.uid)
            setUser({ groupId: [groupId] }, Auth.account.uid, { merge: true })
              .then(() => {
                setIsVerifying(false);
                history.go(0);
              })
              .catch(() => setIsVerifying(false));
        })
        .catch(() => setIsVerifying(false));
    }
  }, [Auth.account?.uid, code, currentId, history]);
  return (
    <>
      <PinInput
        type="alphanumeric"
        onComplete={setCode}
        isDisabled={isVerifying}>
        <PinInputField />
        <PinInputField />
        <PinInputField />
        <PinInputField />
        <PinInputField />
        <PinInputField />
      </PinInput>
    </>
  );
};

export default JoinGroup;
