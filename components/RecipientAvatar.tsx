"use client";

import Avatar from "@mui/material/Avatar";
import styled from "styled-components";
import { useRecipient } from "../hooks/useRecipient";

type Props = ReturnType<typeof useRecipient>;

const StyledAvatar = styled(Avatar)`
  margin: 5px 15px 5px 5px;
`;

const RecipientAvatar = ({
  recipient,
  recipientEmail,
  recipientName,
}: Props) => {
  return recipient?.photoURL ? (
    <StyledAvatar src={recipient.photoURL} />
  ) : (
    <StyledAvatar>
      {recipientName && recipientName[0].toUpperCase()}
    </StyledAvatar>
  );
};

export default RecipientAvatar;
