import styled from "styled-components";
import { IMessage } from "../types";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../config/firebase";
import DoneIcon from "@mui/icons-material/Done";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import { ReactNode, useState } from "react";
import ImageModal from "./ImageModal";

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

const MessageStatus = styled.div`
  display: flex;
  align-items: center;
  font-size: 0.7rem;
  color: gray;
  margin-left: 5px;
`;

const Message = ({ message }: { message: IMessage }) => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  const MessageType =
    loggedInUser?.email === message.user
      ? StyledSenderMessage
      : StyledReceiverMessage;

  return (
    <div>
      <MessageType>
        {message.text}
        {message.fileUrl && message.fileUrl.includes("image") && (
          <img
            src={message.fileUrl}
            alt="Attached image"
            style={{
              maxWidth: "300px",
              maxHeight: "200px",
              marginTop: "10px",
              cursor: "pointer",
            }}
            onClick={() => setIsImageModalOpen(true)}
          />
        )}
        <MessageStatus>
          {loggedInUser?.email === message.user && (
            <>
              <span style={{ fontSize: "0.6rem", marginRight: "3px" }}>
                {new Date(message.sent_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
              {message.isRead ? (
                <DoneAllIcon style={{ fontSize: "0.9rem", color: "#34B7F1" }} />
              ) : (
                <DoneIcon style={{ fontSize: "0.9rem" }} />
              )}
            </>
          )}
        </MessageStatus>
      </MessageType>

      {message.fileUrl && message.fileUrl.includes("image") && (
        <ImageModal
          imageUrl={message.fileUrl}
          isOpen={isImageModalOpen}
          onClose={() => setIsImageModalOpen(false)}
        />
      )}
    </div>
  );
};

export default Message;
