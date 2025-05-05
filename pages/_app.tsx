import type { AppProps } from "next/app";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import Login from "./login";
import Loading from "../components/Loading";
import "../styles/globals.css";
import { useEffect } from "react";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { SocketProvider } from "../context/SocketContext";
import { useRouter } from "next/router";

function MyApp({ Component, pageProps }: AppProps) {
  const [loggedInUser, loading, _error] = useAuthState(auth);
  const router = useRouter();

  useEffect(() => {
    const setUserInDb = async () => {
      try {
        await setDoc(
          doc(db, "users", loggedInUser?.email as string),
          {
            email: loggedInUser?.email,
            lastSeen: serverTimestamp(),
            photoURL: loggedInUser?.photoURL,
            displayName: loggedInUser?.displayName,
          },
          { merge: true }
        );
      } catch (error) {
        console.log("ERROR SETTING USER INFO IN DB", error);
      }
    };

    if (loggedInUser) {
      setUserInDb();
    }
  }, [loggedInUser]);

  useEffect(() => {
    let wasLoggedIn = false;

    return () => {
      if (wasLoggedIn && !loggedInUser && !loading) {
        window.location.href = "/login";
      }

      wasLoggedIn = !!loggedInUser;
    };
  }, [loggedInUser, loading]);

  if (loading) return <Loading />;

  if (!loggedInUser) return <Login />;

  return (
    <SocketProvider>
      <Component {...pageProps} />
    </SocketProvider>
  );
}

export default MyApp;
