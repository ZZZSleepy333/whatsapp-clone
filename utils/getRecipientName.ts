import { User } from "firebase/auth";
import { AppUser, Conversation } from "../types";
import { collection, query, where } from "firebase/firestore";
import { db } from "../config/firebase";
import { useCollection } from "react-firebase-hooks/firestore";

export const getRecipientName = (
  conversationUsers: Conversation["users"],

  loggedInUser?: User | null
) => {
  const targetEmail = conversationUsers.find(
    (userName) => userName !== loggedInUser?.email
  );

  const queryGetRecipient = query(
    collection(db, "users"),
    where("email", "==", targetEmail)
  );
  const [recipientsSnapshot, __loading, __error] =
    useCollection(queryGetRecipient);
  const recipient = recipientsSnapshot?.docs[0]?.data() as AppUser | undefined;
  return recipient?.displayName;
};
