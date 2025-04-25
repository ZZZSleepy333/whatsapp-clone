import { useAuthState } from "react-firebase-hooks/auth";
import styled from "styled-components";
import { auth } from "../config/firebase";
import { IMessage } from "../types";
import { ReactNode } from "react";

const StyledMessage = styled.p`
  width: fit-content;
  word-break: break-all;
  max-width: 90%;
  min-width: 30%;
  padding: 15px 15px 30px;
  border-radius: 8px;
  margin: 10px;
  position: relative;
  background-color: var(--receiver-message);
  color: var(--text-color);
`;

const StyledSenderMessage = styled(StyledMessage)`
  margin-left: auto;
  background-color: var(--sender-message);
`;

const StyledReceiverMessage = styled(StyledMessage)`
  background-color: var(--receiver-message);
`;

const StyledTimestamp = styled.span`
  color: var(--text-color);
  opacity: 0.7;
  padding: 10px;
  font-size: x-small;
  position: absolute;
  bottom: 0;
  right: 0;
  text-align: right;
`;

const Message = ({ message }: { message: IMessage }) => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);

  const MessageType =
    loggedInUser?.email === message.user
      ? StyledSenderMessage
      : StyledReceiverMessage;

  return (
    <StyledMessage as={MessageType}>
      {message.text}

      {/* ✅ Kiểm tra nếu có fileUrl */}
      {message.fileUrl && message.fileUrl.includes("image") && (
        <img src={message.fileUrl} alt="uploaded" width="200"></img>
      )}

      {message.fileUrl && !message.fileUrl.includes("image") && (
        <a href={message.fileUrl} download target="_blank" rel="noreferrer">
          📎 {message.fileUrl.split("/").pop()}
        </a>
      )}

      <StyledTimestamp>{message.sent_at}</StyledTimestamp>
    </StyledMessage>
  );
};

export default Message;
