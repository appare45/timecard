import React, { useContext, useState } from 'react';
import { AuthContext } from '../contexts/user';
import { setUser } from '../utils/user';

type Props = {
  name: string;
  id: string;
};

const NewAccount: React.FC<Props> = ({ name, id }) => {
  const localAuthContext = useContext(AuthContext);

  const [input, updateInput] = useState<string>(name);
  async function applyUserName(name: string, id: string): Promise<void> {
    try {
      const user = await setUser(
        {
          name: name,
        },
        id
      );
      if (localAuthContext.accountEnablement.update) {
        localAuthContext.accountEnablement.update(true);
      }
      return user;
    } catch (error) {
      console.error(error);
      return error;
    }
  }
  return (
    <>
      <h1>アカウント登録</h1>
      <form
        action=""
        onSubmit={(e) => {
          e.preventDefault();
          applyUserName(input, id);
        }}>
        <label htmlFor="name">名前</label>
        <input
          type="text"
          defaultValue={input}
          id="name"
          autoFocus
          onChange={(e) => {
            updateInput(e.target.value);
          }}
        />
        <button type="submit">登録</button>
      </form>
    </>
  );
};

export default NewAccount;
