"use client";

import { useRouter } from "next/router";
import styled from "styled-components";
import { useRecipient } from "../hooks/useRecipient";
import { Conversation } from "../types";
import RecipientAvatar from "./RecipientAvatar";
import { getRecipientName } from "../utils/getRecipientName";

const StyledContainer = styled.div`
  display: flex;
  align-items: center;
  cursor: pointer;
  padding: 15px;
  word-break: break-all;

  :hover {
    background-color: #e9eaeb;
  }
`;

const ConversationSelect = ({
  id,
  conversationUsers,
}: {
  id: string;
  conversationUsers: Conversation["users"];
}) => {
  const { recipient, recipientEmail, recipientName } =
    useRecipient(conversationUsers);

  const router = useRouter();

  const onSelectConversation = () => {
    router.push(`/conversations/${id}`);
  };

  return (
    <StyledContainer onClick={onSelectConversation}>
      <RecipientAvatar
        recipient={recipient}
        recipientEmail={recipientEmail}
        recipientName={recipientName}
      />
      <span>{recipientName}</span>
    </StyledContainer>
  );
};

export default ConversationSelect;
