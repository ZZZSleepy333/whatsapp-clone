import React from "react";
import styled from "styled-components";
import IconButton from "@mui/material/IconButton";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import Image from "next/image";

// Styled components
const StyledFilePreviewContainer = styled.div`
  position: sticky;
  bottom: 70px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--header-bg);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  margin: 0 auto;
  padding: 10px;
  width: 100%;
  z-index: 101;
  overflow-x: auto;
  border-top: 1px solid var(--border-color);
`;

const StyledMultiFileContainer = styled.div`
  display: flex;
  flex-direction: row;
  gap: 8px;
  max-width: 100%;
  padding: 5px;
  scrollbar-width: thin;
  justify-content: flex-start; /* Căn trái */
  width: 100%;

  &::-webkit-scrollbar {
    height: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 4px;
  }
`;

const StyledFilePreview = styled.div`
  padding: 8px;
  background-color: var(--filePreviewBg, #444444);
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 100px;
  max-width: 120px;
  position: relative;
  border: 1px solid var(--filePreviewBorder, #555555);
`;

const StyledFileInfo = styled.div`
  width: 100%;
  margin-top: 5px;
  overflow: hidden;
  text-align: center;

  > p {
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 12px;
    color: var(--filePreviewText, #ffffff);
  }

  > span {
    font-size: 10px;
    color: var(--filePreviewSubtext, #aaaaaa);
    display: block;
  }
`;

const StyledCloseButton = styled(IconButton)`
  padding: 2px !important;
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #e53935 !important;
  color: white;
  width: 20px;
  height: 20px;

  &:hover {
    background-color: #c62828 !important;
  }
`;

const StyledProgressContainer = styled.div`
  width: 100%;
  height: 4px;
  background-color: var(--border-color, #333333);
  border-radius: 2px;
  margin-top: 4px;
  overflow: hidden;
`;

const StyledProgressBar = styled.div<{ progress: number }>`
  height: 100%;
  width: ${(props) => props.progress}%;
  background-color: #25d366;
  transition: width 0.3s ease;
`;

interface FileReviewProps {
  selectedFiles: File[];
  filePreviews: { file: File; preview: string }[];
  uploadProgress: { [key: string]: number };
  isUploading: boolean;
  clearSelectedFiles: () => void;
  removeFile: (index: number) => void;
}

const FileReviewComponent: React.FC<FileReviewProps> = ({
  selectedFiles,
  filePreviews,
  uploadProgress,
  isUploading,
  clearSelectedFiles,
  removeFile,
}) => {
  if (selectedFiles.length === 0) return null;

  return (
    <StyledFilePreviewContainer>
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "10px",
        }}
      >
        <span style={{ color: "var(--text-color)", fontSize: "14px" }}>
          {selectedFiles.length} tệp đã chọn
        </span>
        {selectedFiles.length > 1 && (
          <IconButton
            onClick={clearSelectedFiles}
            style={{
              padding: "4px",
              backgroundColor: "var(--input-bg)",
            }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        )}
      </div>
      <StyledMultiFileContainer>
        {filePreviews.map((item, index) => (
          <StyledFilePreview key={index}>
            {item.preview !== "non-image" &&
            item.file.type.startsWith("image/") ? (
              <Image
                src={item.preview}
                alt="Preview"
                height={60}
                width={60}
                style={{ objectFit: "cover", borderRadius: "4px" }}
                onError={(e) => {
                  console.error("Preview image load error:", e);
                }}
              />
            ) : (
              <AttachFileIcon
                style={{
                  color: item.file.type.includes("pdf")
                    ? "#f40f02"
                    : item.file.type.includes("word") ||
                      item.file.type.includes("doc")
                    ? "#2b579a"
                    : item.file.type.includes("excel") ||
                      item.file.type.includes("sheet")
                    ? "#217346"
                    : "var(--filePreviewText, #ffffff)",
                  fontSize: "36px",
                }}
              />
            )}
            <StyledFileInfo>
              <p>{item.file.name}</p>
              <span>{(item.file.size / 1024).toFixed(1)} KB</span>
              {isUploading && uploadProgress[item.file.name] !== undefined && (
                <StyledProgressContainer>
                  <StyledProgressBar progress={uploadProgress[item.file.name]} />
                </StyledProgressContainer>
              )}
            </StyledFileInfo>
            <StyledCloseButton size="small" onClick={() => removeFile(index)}>
              <CloseIcon fontSize="small" />
            </StyledCloseButton>
          </StyledFilePreview>
        ))}
      </StyledMultiFileContainer>
    </StyledFilePreviewContainer>
  );
};

export default FileReviewComponent;