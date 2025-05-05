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
import ImageIcon from "@mui/icons-material/Image";
import SearchIcon from "@mui/icons-material/Search";
import CloseIcon from "@mui/icons-material/Close";
import { useRouter } from "next/router";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import { useCollection } from "react-firebase-hooks/firestore";
import Message from "./Message";
import InsertEmoticonIcon from "@mui/icons-material/InsertEmoticon";
import SendIcon from "@mui/icons-material/Send";
import MicIcon from "@mui/icons-material/Mic";
import CircularProgress from "@mui/material/CircularProgress";
import {
  KeyboardEventHandler,
  MouseEventHandler,
  useRef,
  useState,
  useEffect,
} from "react";
import {
  addDoc,
  collection,
  doc,
  serverTimestamp,
  setDoc,
  updateDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore";
import Image from "next/image";

import { getRecipientName } from "../utils/getRecipientName";
import EmojiPicker from "emoji-picker-react";
import EmojiPickerComponent from "./EmojiPickerButton";
import ImageSidebar from "./ImageSidebar";
import cloudinary from "../config/cloudinary";
import FileReviewComponent from "./FileReviewComponent";
import ImageModal from "./ImageModal";
import axios from "axios";

import { useSocket } from "../context/SocketContext";
import { useSocketEvents } from "../hooks/useSocketEvents";

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

const SearchContainer = styled.div`
  position: sticky;
  top: 80px;
  left: 0;
  right: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--header-bg);
  border-bottom: 1px solid var(--border-color);
  padding: 10px;
  width: 100%;
  z-index: 99;
  overflow-x: auto;
`;

const SearchHeader = styled.div`
  width: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
`;

const SearchInput = styled.input`
  flex-grow: 1;
  outline: none;
  border: none;
  border-radius: 8px;
  background-color: var(--input-bg);
  padding: 10px 15px;
  margin: 0 10px;
  color: var(--text-color);
  width: calc(100% - 60px);
`;

const SearchResultsContainer = styled.div`
  width: 100%;
  background-color: var(--conversation-bg);
  border-radius: 8px;
  max-height: 300px;
  overflow-y: auto;
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  margin-top: 5px;

  &::-webkit-scrollbar {
    height: 4px;
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background-color: var(--border-color);
    border-radius: 4px;
  }
`;

const SearchResultItem = styled.div`
  padding: 10px 15px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;

  &:hover {
    background-color: var(--filePreviewBg, #444444);
  }

  > p {
    margin: 0;
    font-size: 14px;
    color: var(--text-color);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  > span {
    font-size: 12px;
    color: var(--filePreviewSubtext, #aaaaaa);
    display: block;
  }
`;

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

  const [isImageModalOpen, setIsImageModalOpen] = useState(false);
  const [isImageSidebarOpen, setIsImageSidebarOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");
  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const MAX_FILES = 5;
  const conversationUsers = conversation.users;

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<IMessage[]>([]);

  const { recipientEmail, recipient, recipientName } =
    useRecipient(conversationUsers);

  const router = useRouter();
  const conversationId = router.query.id;

  const queryGetMessages = generateQueryGetMessages(conversationId as string);

  const [messagesSnapshot, messagesLoading, __error] =
    useCollection(queryGetMessages);

  const searchMessages = () => {
    if (!searchQuery.trim() || !messagesSnapshot) return;

    const results = messagesSnapshot.docs
      .map((message) => transformMessage(message))
      .filter((message) =>
        message.text.toLowerCase().includes(searchQuery.toLowerCase())
      );

    setSearchResults(results);
  };

  useEffect(() => {
    if (searchQuery.trim()) {
      searchMessages();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery]);

  const scrollToMessage = (messageId: string) => {
    const messageElement = document.getElementById(`message-${messageId}`);
    if (messageElement) {
      messageElement.scrollIntoView({ behavior: "smooth" });
      messageElement.classList.add("highlight-message");
      setTimeout(() => {
        messageElement.classList.remove("highlight-message");
      }, 2000);
    }
    setIsSearchOpen(false);
    setSearchQuery("");
    setSearchResults([]);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    console.log("File input changed", event.target.files);
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);

      if (selectedFiles.length + newFiles.length > MAX_FILES) {
        alert(
          `Bạn chỉ có thể tải lên tối đa ${MAX_FILES} tệp cùng lúc. Hiện tại bạn đã chọn ${selectedFiles.length} tệp.`
        );
        return;
      }

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

      const updatedFiles = [...selectedFiles, ...newFiles];
      setSelectedFiles(updatedFiles);

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
          <div key={message.id} id={`message-${message.id}`}>
            <Message message={msgData} />

            {/* {msgData.fileUrl && msgData.fileUrl.includes("image") && (
              <div 
                style={{ 
                  cursor: 'pointer', 
                  maxWidth: '300px', 
                  margin: msgData.user === loggedInUser?.email ? '0 0 0 auto' : '0'
                }}
                onClick={() => {
                  setSelectedImage(msgData.fileUrl || "");
                  setIsImageModalOpen(true);
                }}
              >
                <img
                  src={msgData.fileUrl}
                  alt="Attached image"
                  style={{ 
                    maxWidth: '100%', 
                    borderRadius: '8px',
                    marginTop: '5px'
                  }}
                />
              </div>
            )} */}

            {/* {msgData.fileUrl && !msgData.fileUrl.includes("image") && (
              <a
                href={msgData.fileUrl}
                download
                target="_blank"
                rel="noreferrer"
              >
                📎 {msgData.fileUrl.split("/").pop()}
              </a>
            )} */}
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

      axios
        .post("/api/upload", formData, {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent: any) => {
            if (progressEvent.total) {
              const progress = Math.round(
                (progressEvent.loaded / progressEvent.total) * 100
              );
              setUploadProgress((prev) => ({
                ...prev,
                [file.name]: progress,
              }));
            }
          },
        })
        .then((response) => {
          resolve(response.data.url);
        })
        .catch((error) => {
          reject(new Error(`Upload failed: ${error.message}`));
        });
    });
  };

  useEffect(() => {
    const markMessagesAsRead = async () => {
      if (!loggedInUser?.email || !conversationId) return;

      try {
        const unreadMessagesQuery = query(
          collection(db, "messages"),
          where("conversation_id", "==", conversationId),
          where("user", "!=", loggedInUser.email),
          where("isRead", "==", false)
        );

        const unreadMessagesSnapshot = await getDocs(unreadMessagesQuery);

        const updatePromises = unreadMessagesSnapshot.docs.map(
          async (messageDoc) => {
            await updateDoc(doc(db, "messages", messageDoc.id), {
              isRead: true,
              readAt: serverTimestamp(),
            });
          }
        );

        await Promise.all(updatePromises);
      } catch (error) {
        console.error("Lỗi khi đánh dấu tin nhắn đã đọc:", error);
      }
    };

    markMessagesAsRead();
  }, [conversationId, loggedInUser?.email, messagesSnapshot]);

  const addMessageToDbAndUpdateLastSeen = async () => {
    const fileUrls: string[] = [];
    setIsUploading(true);

    try {
      if (selectedFiles.length > 0) {
        const progressCopy = { ...uploadProgress };

        for (const file of selectedFiles) {
          try {
            const fileUrl = await uploadToCloudinary(file);
            fileUrls.push(fileUrl);
          } catch (error) {
            console.error(`Upload failed for ${file.name}:`, error);
          }
        }
      }

      await setDoc(
        doc(db, "users", loggedInUser?.email as string),
        { lastSeen: serverTimestamp() },
        { merge: true }
      );

      if (fileUrls.length > 0) {
        for (const fileUrl of fileUrls) {
          await addDoc(collection(db, "messages"), {
            conversation_id: conversationId,
            sent_at: serverTimestamp(),
            text: newMessage || "",
            fileUrl,
            user: loggedInUser?.email,
            isRead: false,
          });
        }
      } else {
        await addDoc(collection(db, "messages"), {
          conversation_id: conversationId,
          sent_at: serverTimestamp(),
          text: newMessage,
          user: loggedInUser?.email,
          isRead: false,
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
  const toggleImageSidebar = () => {
    setIsImageSidebarOpen(!isImageSidebarOpen);
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
          <IconButton onClick={() => setIsSearchOpen(!isSearchOpen)}>
            <SearchIcon />
          </IconButton>
          <IconButton onClick={toggleImageSidebar}>
            <ImageIcon />
          </IconButton>
        </StyledHeaderIcons>
      </StyledRecipientHeader>

      {isSearchOpen && (
        <SearchContainer>
          <SearchHeader></SearchHeader>
          <div style={{ display: "flex", width: "100%", alignItems: "center" }}>
            <SearchIcon
              style={{ color: "var(--text-color)", marginLeft: "5px" }}
            />
            <SearchInput
              placeholder="Nhập từ khóa tìm kiếm..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
            />
            <IconButton
              onClick={() => setIsSearchOpen(false)}
              style={{
                padding: "4px",
                backgroundColor: "var(--input-bg)",
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </div>

          {searchResults.length > 0 && (
            <SearchResultsContainer>
              {searchResults.map((result) => (
                <SearchResultItem
                  key={result.id}
                  onClick={() => scrollToMessage(result.id)}
                >
                  <p>
                    {result.text.length > 50
                      ? result.text.substring(0, 50) + "..."
                      : result.text}
                  </p>
                  <span>{result.sent_at}</span>
                </SearchResultItem>
              ))}
            </SearchResultsContainer>
          )}
        </SearchContainer>
      )}

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

      <ImageModal
        imageUrl={selectedImage}
        isOpen={isImageModalOpen}
        onClose={() => setIsImageModalOpen(false)}
      />

      {conversationId && (
        <ImageSidebar
          conversationId={conversationId as string}
          isOpen={isImageSidebarOpen}
          toggleSidebar={toggleImageSidebar}
        />
      )}
    </>
  );
};

export default ConversationScreen;
