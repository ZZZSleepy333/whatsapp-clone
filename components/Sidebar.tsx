"use client";

import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import styled from "styled-components";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVerticalIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import {
  TextField,
  DialogActions,
  Snackbar,
  useMediaQuery,
} from "@mui/material";
import { useAuthState } from "react-firebase-hooks/auth";
import { SetStateAction, useState, useEffect } from "react";
import * as EmailValidator from "email-validator";
import { addDoc, collection, query, where, getDocs } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { Conversation } from "../types";
import ConversationSelect from "./ConversationSelect";
import { Menu, MenuItem } from "@mui/material";
import Brightness4Icon from "@mui/icons-material/Brightness4";
import Brightness7Icon from "@mui/icons-material/Brightness7";
import UserProfileModal from "./UserProfileModal";

const DesktopToggleButton = styled(IconButton)`
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 99;
  background-color: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);

  @media (max-width: 768px) {
    display: none;
  }

  display: ${(props: { isOpen?: boolean }) => (props.isOpen ? "none" : "flex")};
`;

const StyledContainer = styled.div<{ isOpen: boolean }>`
  height: 100vh;
  overflow-y: scroll;
  border-right: 1px solid whitesmoke;
  transition: all 0.3s ease-in-out;
  position: relative;
  background-color: white;

  ::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;

  width: ${({ isOpen }) => (isOpen ? "400px" : "0")};
  min-width: ${({ isOpen }) => (isOpen ? "300px" : "0")};
  max-width: ${({ isOpen }) => (isOpen ? "400px" : "0")};
  transform: ${({ isOpen }) =>
    isOpen ? "translateX(0)" : "translateX(-100%)"};
  visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
  opacity: ${({ isOpen }) => (isOpen ? "1" : "0")};

  @media (max-width: 768px) {
    position: fixed;
    z-index: 100;
    width: 80%;
    max-width: 320px;
    min-width: auto;
    transform: ${({ isOpen }) =>
      isOpen ? "translateX(0)" : "translateX(-100%)"};
    box-shadow: ${({ isOpen }) =>
      isOpen ? "0 0 10px rgba(0, 0, 0, 0.2)" : "none"};
    visibility: ${({ isOpen }) => (isOpen ? "visible" : "hidden")};
    opacity: 1;
  }
  background-color: ${({ theme }) => theme.conversationBg};
  border-right: 1px solid ${({ theme }) => theme.border};
`;

const StyledHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px;
  height: 80px;
  border-bottom: 1px solid whitesmoke;
  position: sticky;
  top: 0;
  background-color: white;
  z-index: 1;
  background-color: ${({ theme }) => theme.headerBg};
  border-bottom: 1px solid ${({ theme }) => theme.border};
`;

const StyledSearch = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 2px;
`;

const StyledUserAvatar = styled(Avatar)`
  cursor: pointer;
  :hover {
    opacity: 0.8;
  }
`;

const StyledSearchInput = styled.input`
  outline: none;
  border: none;
  flex: 1;
`;

const StyledSidebarButton = styled(Button)`
  width: 100%;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
  background-color: var(--input-bg);
  color: var(--text-color);

  &:hover {
    background-color: var(--receiver-message);
  }
`;

const StyledH3 = styled.h3`
  word-break: break-all;

  @media (max-width: 768px) {
    font-size: 1rem;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
`;

const ToggleButton = styled(IconButton)`
  position: fixed;
  top: 10px;
  left: 10px;
  z-index: 99;
  background-color: white;
  box-shadow: 0 0 5px rgba(0, 0, 0, 0.2);

  @media (min-width: 769px) {
    display: none;
  }
`;

const Overlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 90;
  display: ${({ isOpen }) => (isOpen ? "block" : "none")};

  @media (min-width: 769px) {
    display: none;
  }
`;

const Sidebar = () => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);
  const [isOpenNewConversationDialog, setIsOpenNewConversationDialog] =
    useState(false);
  const [recipientEmail, setRecipientEmail] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [search, setSearcch] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);

  const isMobile = useMediaQuery("(max-width:768px)");

  useEffect(() => {
    if (isMobile) {
      setIsSidebarOpen(false);
    } else {
      setIsSidebarOpen(true);
    }
  }, [isMobile]);

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const showSnackbar = (message: SetStateAction<string>) => {
    setSnackbarMessage(message);
    setSnackbarOpen(true);
  };

  const toggleNewConversationDialog = (isOpen: boolean) => {
    setIsOpenNewConversationDialog(isOpen);
    if (!isOpen) setRecipientEmail("");
  };

  const closeNewConversationDialog = () => {
    toggleNewConversationDialog(false);
  };

  const queryGetConversationsForCurrentUser = query(
    collection(db, "conversations"),
    where("users", "array-contains", loggedInUser?.email)
  );
  const queryUserList = (recipientEmail: string) => {
    const userQuery = query(
      collection(db, "users"),
      where("email", "==", recipientEmail)
    );

    return userQuery;
  };
  const [conversationsSnapshot, __loading, __error] = useCollection(
    queryGetConversationsForCurrentUser
  );

  const isConversationAlreadyExists = (recipientEmail: string) =>
    conversationsSnapshot?.docs.find((conversation) =>
      (conversation.data() as Conversation).users.includes(recipientEmail)
    );

  const isInvitingSelf = recipientEmail === loggedInUser?.email;

  const isUsersExists = (recipientEmail: string) =>
    queryUserList(recipientEmail) == null ? true : false;

  const createConversation = async () => {
    console.log(recipientEmail);
    if (!recipientEmail) return;

    if (EmailValidator.validate(recipientEmail) && isInvitingSelf) {
      showSnackbar("You cannot invite yourself");
    } else if (isConversationAlreadyExists(recipientEmail)) {
      showSnackbar("Conversation already exists");
    } else {
      const userQuery = queryUserList(recipientEmail);
      const userSnapshot = await getDocs(userQuery);

      console.log(
        "Kết quả query:",
        userSnapshot.docs.map((doc) => doc.data())
      );

      if (userSnapshot.empty) {
        showSnackbar("User does not exist");
      } else {
        await addDoc(collection(db, "conversations"), {
          users: [loggedInUser?.email, recipientEmail],
        });
        closeNewConversationDialog();
      }
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);

      window.location.href = "/login";
    } catch (error) {
      console.log("ERROR LOGGING OUT", error);
    }
  };

  const filteredConversations = conversationsSnapshot?.docs.filter(
    (conversation) => {
      const conversationUsers = conversation.data().users || [];
      return conversationUsers.some((user: string) =>
        user.toLowerCase().includes(search.toLowerCase())
      );
    }
  );

  useEffect(() => {
    const savedTheme = localStorage.getItem("darkMode");
    if (savedTheme === "true") {
      setDarkMode(true);
      document.body.classList.add("dark-mode");
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);

    if (newDarkMode) {
      document.body.classList.add("dark-mode");
    } else {
      document.body.classList.remove("dark-mode");
    }

    localStorage.setItem("darkMode", newDarkMode.toString());
  };

  const handleConversationSelect = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const handleOpenUserModal = () => {
    setIsUserModalOpen(true);
  };

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  return (
    <>
      {isMobile && (
        <ToggleButton onClick={toggleSidebar}>
          {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
        </ToggleButton>
      )}

      {!isMobile && !isSidebarOpen && (
        <DesktopToggleButton onClick={toggleSidebar}>
          <MenuIcon />
        </DesktopToggleButton>
      )}

      <Overlay isOpen={isSidebarOpen && isMobile} onClick={toggleSidebar} />

      <StyledContainer isOpen={isSidebarOpen}>
        <StyledHeader>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              cursor: "pointer",
              gap: "12px",
            }}
            onClick={handleOpenUserModal}
          >
            <StyledUserAvatar src={loggedInUser?.photoURL || ""} />
            <StyledH3>{loggedInUser?.displayName as string}</StyledH3>
          </div>

          <div>
            <IconButton onClick={toggleDarkMode}>
              {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>

            <IconButton>
              <LogoutIcon onClick={logout} />
            </IconButton>
            <IconButton onClick={toggleSidebar}>
              {isSidebarOpen ? <CloseIcon /> : <MenuIcon />}
            </IconButton>
          </div>
        </StyledHeader>
        <StyledSearch>
          <SearchIcon />
          <StyledSearchInput
            placeholder="Search in conversations"
            onChange={(e) => setSearcch(e.target.value)}
          />
        </StyledSearch>
        <StyledSidebarButton
          onClick={() => {
            toggleNewConversationDialog(true);
          }}
        >
          Start a new conversation
        </StyledSidebarButton>
        {filteredConversations?.map((conversation) => (
          <div onClick={handleConversationSelect} key={conversation.id}>
            <ConversationSelect
              id={conversation.id}
              conversationUsers={(conversation.data() as Conversation).users}
            />
          </div>
        ))}

        <Dialog
          open={isOpenNewConversationDialog}
          onClose={closeNewConversationDialog}
        >
          <DialogTitle>New Conversation</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Please enter a Google email address for the user you wish to chat
              with
            </DialogContentText>
            <TextField
              autoFocus
              label="Email Address"
              type="email"
              fullWidth
              variant="standard"
              value={recipientEmail}
              onChange={(event) => {
                setRecipientEmail(event.target.value);
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={closeNewConversationDialog}>Cancel</Button>
            <Button disabled={!recipientEmail} onClick={createConversation}>
              Create
            </Button>
            <Snackbar
              open={snackbarOpen}
              autoHideDuration={5000}
              onClose={() => setSnackbarOpen(false)}
              message={snackbarMessage}
            />
          </DialogActions>
        </Dialog>
      </StyledContainer>

      <UserProfileModal
        open={isUserModalOpen}
        onClose={handleCloseUserModal}
        user={loggedInUser}
        showSnackbar={showSnackbar}
      />
    </>
  );
};

export default Sidebar;
