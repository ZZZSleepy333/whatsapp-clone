"use client";

import styled from "styled-components";
import { IMessage } from "../types";

// Styled Components cho Sidebar
const StyledSidebar = styled.div`
  width: 250px;
  height: 100vh;
  position: fixed;
  right: 0;
  top: 0;
  background-color: #f5f5f5;
  border-left: 1px solid #ddd;
  padding: 10px;
  overflow-y: auto;
`;

const StyledImage = styled.img`
  width: 100%;
  border-radius: 5px;
  cursor: pointer;
  margin-bottom: 10px;
`;

const StyledTitle = styled.h4`
  text-align: center;
  margin-bottom: 10px;
`;

const ImageSidebar = ({ messages }: { messages: IMessage[] }) => {
  // Lọc danh sách tin nhắn có hình ảnh
  const images = messages.filter(
    (msg) => msg.fileUrl && msg.fileUrl.includes("image")
  );

  return (
    <StyledSidebar>
      <StyledTitle>Ảnh đã gửi</StyledTitle>
      {images.length === 0 ? (
        <p>Không có hình ảnh nào</p>
      ) : (
        images.map((img, index) => (
          <a
            key={index}
            href={img.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            <StyledImage src={img.fileUrl} alt="sent" />
          </a>
        ))
      )}
    </StyledSidebar>
  );
};

export default ImageSidebar;
