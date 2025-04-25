"use client";

import IconButton from "@mui/material/IconButton";
import styled from "styled-components";
import { useRecipient } from "../hooks/useRecipient";
import { Conversation, IMessage } from "../types";
import {
  convertFirestoreTimestampToString,
  generateQueryGetMessages,
  transformMessage,
} from "../utils/getMessagesInConversation";
import RecipientAvatar from "./RecipientAvatar";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import Message from "./Message";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import CloseIcon from "@mui/icons-material/Close";
import CircularProgress from "@mui/material/CircularProgress";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  useRef,
  useState,
} from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import Image from "next/image";
// import {
//   getStorage,
//   ref,
//   uploadBytes,
//   getDownloadURL,
//   uploadBytesResumable,
// } from "firebase/storage";
import { getRecipientName } from "../utils/getRecipientName";
import EmojiPicker from "emoji-picker-react";
import EmojiPickerComponent from "./EmojiPickerButton";
import ImageSidebar from "./ImageSidebar";
import cloudinary from "../config/cloudinary";
import FileReviewComponent from "./FileReviewComponent";

const StyledRecipientHeader = styled.div`
  position: sticky;
  background-color: white;
  z-index: 100;
  top: 0;
  display: flex;
  align-items: center;
  padding: 11px;
  height: 80px;
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const StyledHeaderInfo = styled.div`
  flex-grow: 1;

  > h3 {
    margin-top: 0;
    margin-bottom: 3px;
  }

  > span {
    font-size: 14px;
    color: var(--text-color);
    opacity: 0.7;
  }
`;

const StyledH3 = styled.h3`
  word-break: break-all;
`;

const StyledHeaderIcons = styled.div`
  display: flex;
`;

const StyledMessageContainer = styled.div`
  padding: 30px;
  background-color: #e5ded8;
  min-height: 90vh;
`;

const StyledInputContainer = styled.form`
  display: flex;
  align-items: center;
  padding: 10px;
  position: sticky;
  bottom: 0;
  background-color: ${({ theme }) => theme.headerBg};
  z-index: 100;
`;

const StyledInput = styled.input`
  flex-grow: 1;
  outline: none;
  border: none;
  border-radius: 10px;
  background-color: whitesmoke;
  padding: 15px;
  margin-left: 15px;
  margin-right: 15px;
`;

const EndOfMessagesForAutoScroll = styled.div`
  margin-bottom: 30px;
`;

const InputAndPreviewContainer = styled.div`
  position: relative;
  width: 100%;
`;

// Xóa các styled components sau vì đã chuyển sang FileReviewComponent:
// StyledFilePreviewContainer, StyledMultiFileContainer, StyledFilePreview,
// StyledFileInfo, StyledCloseButton, StyledProgressContainer, StyledProgressBar

const ConversationScreen = ({
  conversation,
  messages,
}: {
  conversation: Conversation;
  messages: IMessage[];
}) => {
  const [newMessage, setNewMessage] = useState("");
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [filePreviews, setFilePreviews] = useState<
    { file: File; preview: string }[]
  >([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [isUploading, setIsUploading] = useState(false);
  const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  const MAX_FILES = 5;
  const conversationUsers = conversation.users;

  const { recipientEmail, recipient, recipientName } =
    useRecipient(conversationUsers);

  const router = useRouter();
  const conversationId = router.query.id;

  const queryGetMessages = generateQueryGetMessages(conversationId as string);

  const [messagesSnapshot, messagesLoading, __error] =
    useCollection(queryGetMessages);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed", event.target.files);
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);

      // Kiểm tra tổng số lượng tệp (hiện tại + mới)
      if (selectedFiles.length + newFiles.length > MAX_FILES) {
        alert(
          `Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp cùng lúc. Hiện tại bạn đã chọn ${selectedFiles.length} tệp.`
        );
        return;
      }

      // Kiểm tra kích thước tệp
      const oversizedFiles = newFiles.filter(
        (file) => file.size > MAX_FILE_SIZE
      );
      if (oversizedFiles.length > 0) {
        alert(
          `Các tệp sau vượt quá giới hạn 10MB: ${oversizedFiles
            .map((f) => `${f.name} (${(f.size / (1024 * 1024)).toFixed(2)}MB)`)
            .join(", ")}`
        );
        return;
      }

      // Thêm các file mới vào mảng hiện có
      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);

      // Tạo xem trước cho các tệp mới
      const newPreviews: { file: File; preview: string }[] = [];

      newFiles.forEach((file) => {
        if (file.type.startsWith("image/")) {
          try {
            const reader = new FileReader();
            reader.onload = (e) => {
              if (e.target && e.target.result) {
                newPreviews.push({
                  file,
                  preview: e.target.result as string,
                });

                if (newPreviews.length === newFiles.length) {
                  // Cập nhật filePreviews bằng cách thêm vào mảng hiện có
                  setFilePreviews((prev) => [...prev, ...newPreviews]);
                }
              }
            };
            reader.readAsDataURL(file);
          } catch (error) {
            console.error("Error reading file:", error);
            newPreviews.push({
              file,
              preview: "non-image",
            });
          }
        } else {
          newPreviews.push({
            file,
            preview: "non-image",
          });
        }
      });

      // Nếu không có tệp hình ảnh, cập nhật state ngay lập tức
      if (newPreviews.length === newFiles.length) {
        setFilePreviews((prev) => [...prev, ...newPreviews]);
      }
    } else {
      console.log("No files selected");
    }
  };

  const clearSelectedFiles = () => {
    setSelectedFiles([]);
    setFilePreviews([]);
    // Reset the file input
    const fileInput = document.getElementById("fileInput") as HTMLInputElement;
    if (fileInput) fileInput.value = "";
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
    setFilePreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const showMessages = () => {
    if (messagesLoading) {
      return messages.map((message) => (
        <Message key={message.id} message={message} />
      ));
    }

    if (messagesSnapshot) {
      return messagesSnapshot.docs.map((message) => {
        const msgData = transformMessage(message);
        return (
          <div key={message.id}>
            <Message message={msgData} />

            {/* Hiển thị hình ảnh nếu có và là file hình ảnh */}
            {/* {msgData.fileUrl && msgData.fileUrl.includes("image") && (
              <Image
                src={msgData.fileUrl}
                alt="uploaded"
                width={200}
                height={200}
                style={{ objectFit: "contain", maxHeight: "300px" }}
                onError={(e) => console.error("Image load error:", e)}
              />
            )} */}

            {/* Hiển thị link tải file nếu không phải ảnh */}
            {msgData.fileUrl && !msgData.fileUrl.includes("image") && (
              <a
                href={msgData.fileUrl}
                download
                target="_blank"
                rel="noreferrer"
              >
                📎 {msgData.fileUrl.split("/").pop()}
              </a>
            )}
          </div>
        );
      });
    }

    return null;
  };
  const uploadToCloudinary = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append("file", file);

      const xhr = new XMLHttpRequest();
      xhr.open("POST", "/api/upload", true);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100);
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: progress,
          }));
        }
      };

      xhr.onload = function () {
        if (this.status >= 200 && this.status < 300) {
          const response = JSON.parse(this.responseText);
          resolve(response.url);
        } else {
          reject(new Error(`Upload failed: ${this.statusText}`));
        }
      };

      xhr.onerror = function () {
        reject(new Error("XHR request failed"));
      };

      xhr.send(formData);
    });
  };

  const addMessageToDbAndUpdateLastSeen = async () => {
    const fileUrls: string[] = [];
    setIsUploading(true);

    try {
      // Nếu có file, tải lên Cloudinary trước
      if (selectedFiles.length > 0) {
        // Tạo một bản sao của uploadProgress để cập nhật
        const progressCopy = { ...uploadProgress };

        // Tải lên từng tệp một
        for (const file of selectedFiles) {
          try {
            const fileUrl = await uploadToCloudinary(file);
            fileUrls.push(fileUrl);
          } catch (error) {
            console.error(`Upload failed for ${file.name}:`, error);
          }
        }
      }

      // Cập nhật trạng thái lastSeen
      await setDoc(
        doc(db, "users", loggedInUser?.email as string),
        { lastSeen: serverTimestamp() },
        { merge: true }
      );

      // Nếu có nhiều tệp, tạo nhiều tin nhắn
      if (fileUrls.length > 0) {
        for (const fileUrl of fileUrls) {
          await addDoc(collection(db, "messages"), {
            conversation_id: conversationId,
            sent_at: serverTimestamp(),
            text: newMessage || "", // Nếu chỉ gửi file thì text có thể trống
            fileUrl,
            user: loggedInUser?.email,
          });
        }
      } else {
        // Nếu chỉ có tin nhắn văn bản
        await addDoc(collection(db, "messages"), {
          conversation_id: conversationId,
          sent_at: serverTimestamp(),
          text: newMessage,
          user: loggedInUser?.email,
        });
      }

      setNewMessage("");
      clearSelectedFiles();
      setUploadProgress({});
      setIsUploading(false);
      scrollToBottom();
    } catch (error) {
      console.error("Error sending message:", error);
      setIsUploading(false);
    }
  };

  const sendMessageOnEnter: KeyboardEventHandler<HTMLInputElement> = (
    event
  ) => {
    if (event.key === "Enter") {
      event.preventDefault();
      console.log("Enter pressed", { newMessage, selectedFiles });
      if (!newMessage && selectedFiles.length === 0) return;
      addMessageToDbAndUpdateLastSeen();
    }
  };

  const sendMessageOnClick: MouseEventHandler<HTMLButtonElement> = (event) => {
    event.preventDefault();
    console.log("Send button clicked", { newMessage, selectedFiles });
    if (!newMessage && selectedFiles.length === 0) return;
    addMessageToDbAndUpdateLastSeen();
  };

  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage((prev) => prev + emoji);
  };

  return (
    <>
      <StyledRecipientHeader>
        <RecipientAvatar
          recipient={recipient}
          recipientEmail={recipientEmail}
          recipientName={recipientName}
        />

        <StyledHeaderInfo>
          <StyledH3>{recipientName}</StyledH3>
          {recipient && (
            <span>
              Last active:{" "}
              {convertFirestoreTimestampToString(recipient.lastSeen)}
            </span>
          )}
        </StyledHeaderInfo>

        <StyledHeaderIcons>
          <IconButton>
            <AttachFileIcon />
          </IconButton>
          <IconButton>
            <MoreVertIcon />
          </IconButton>
        </StyledHeaderIcons>
      </StyledRecipientHeader>

      <StyledMessageContainer>
        {showMessages()}

        <EndOfMessagesForAutoScroll ref={endOfMessagesRef} />
      </StyledMessageContainer>

      <FileReviewComponent
        selectedFiles={selectedFiles}
        filePreviews={filePreviews}
        uploadProgress={uploadProgress}
        isUploading={isUploading}
        clearSelectedFiles={clearSelectedFiles}
        removeFile={removeFile}
      />

      <StyledInputContainer>
        <EmojiPickerComponent onSelect={handleEmojiSelect} />
        <StyledInput
          value={newMessage}
          onChange={(event) => setNewMessage(event.target.value)}
          onKeyDown={sendMessageOnEnter}
        />
        <IconButton
          onClick={sendMessageOnClick}
          disabled={(!newMessage && selectedFiles.length === 0) || isUploading}
        >
          <SendIcon />
        </IconButton>
        <IconButton
          onClick={() => {
            console.log("Attach file button clicked");
            const fileInput = document.getElementById(
              "fileInput"
            ) as HTMLInputElement;
            fileInput?.click();
          }}
          disabled={isUploading}
        >
          <AttachFileIcon />
        </IconButton>
        <input
          type="file"
          id="fileInput"
          style={{ display: "none" }}
          onChange={handleFileChange}
        />
      </StyledInputContainer>
    </>
  );
};

export default ConversationScreen;
