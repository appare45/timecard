import React from 'react';
import { FirebaseAuth } from 'react-firebaseui';
import { Auth, firebase } from './../utils/firebase';
export default function Login(props: { redirectPath: string }): JSX.Element {
  const firebaseUiConfig: firebaseui.auth.Config = {
    signInOptions: [firebase.auth.GoogleAuthProvider.PROVIDER_ID],
    signInSuccessUrl: `${process.env.REACT_APP_URL}${props.redirectPath}`,
  };
  return <FirebaseAuth uiConfig={firebaseUiConfig} firebaseAuth={Auth} />;
}
