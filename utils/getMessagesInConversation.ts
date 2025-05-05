import {
  collection,
  DocumentData,
  orderBy,
  query,
  QueryDocumentSnapshot,
  Timestamp,
  where,
} from "firebase/firestore";
import { db } from "../config/firebase";
import { IMessage } from "../types";

export const generateQueryGetMessages = (conversationId?: string) =>
  query(
    collection(db, "messages"),
    where("conversation_id", "==", conversationId),
    orderBy("sent_at", "asc")
  );

export const transformMessage = (message: DocumentData) => {
  return {
    id: message.id,
    ...message.data(),
    sent_at: message.data().sent_at
      ? convertFirestoreTimestampToString(message.data().sent_at)
      : null,
    readAt: message.data().readAt
      ? convertFirestoreTimestampToString(message.data().readAt)
      : null,
  };
};

export const convertFirestoreTimestampToString = (timestamp: Timestamp) =>
  new Date(timestamp.toDate().getTime()).toLocaleString();
