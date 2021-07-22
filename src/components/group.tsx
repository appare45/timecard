import React from 'react';

type groupProps = {
  groupIds: string[];
  children: JSX.Element;
};

const Group: React.FC<groupProps> = ({ groupIds, children }) => {
  return (
    <>
      {groupIds.length ? (
        <>
          <ul>
            {groupIds.map((group) => (
              <li key={group}>{group}</li>
            ))}
          </ul>
          {children}
        </>
      ) : (
        <>
          <h1>グループの作成</h1>
          <section>
            <p>現在では既存のグループに参加することはできません。</p>
            <p>将来的に対応予定なのでしばらくお待ちください</p>
          </section>
        </>
      )}
    </>
  );
};

export default Group;
