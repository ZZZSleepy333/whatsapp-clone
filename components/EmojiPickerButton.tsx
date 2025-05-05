"use client";

import React, { useState } from "react";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import styled from "styled-components";
import { FaSmile } from "react-icons/fa";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";

const PickerWrapper = styled.div`
  position: relative;
`;

const EmojiButton = styled.button`
  padding: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background: transparent;
  }

  &:focus {
    outline: none;
    background: transparent;
  }

  &:active {
    background: transparent;
  }
`;

const PickerContainer = styled.div`
  position: absolute;
  bottom: 50px;
  left: 0;
  background: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  z-index: 100;
`;

const EmojiPickerComponent = ({
  onSelect,
}: {
  onSelect: (emoji: string) => void;
}) => {
  const [showPicker, setShowPicker] = useState(false);

  return (
    <PickerWrapper>
      <EmojiButton
        onClick={(e) => {
          e.preventDefault();
          setShowPicker(!showPicker);
        }}
      >
        <InsertEmoticonIcon style={{ fontSize: 24, color: "#555" }} />
      </EmojiButton>

      {showPicker && (
        <PickerContainer>
          <EmojiPicker
            onEmojiClick={(emojiData: EmojiClickData) => {
              onSelect(emojiData.emoji);
              setShowPicker(false);
            }}
          />
        </PickerContainer>
      )}
    </PickerWrapper>
  );
};

export default EmojiPickerComponent;
