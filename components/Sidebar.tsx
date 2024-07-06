import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import Tooltip from "@mui/material/Tooltip";
import styled from "styled-components";
import ChatIcon from "@mui/icons-material/Chat";
import MoreVerticalIcon from "@mui/icons-material/MoreVert";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import Button from "@mui/material/Button";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import { TextField, DialogActions, Snackbar } from "@mui/material";
import { useAuthState } from "react-firebase-hooks/auth";
import { SetStateAction, useState } from "react";
import * as EmailValidator from "email-validator";
import { addDoc, collection, query, where } from "firebase/firestore";
import { useCollection } from "react-firebase-hooks/firestore";
import { Conversation } from "../types";
import ConversationSelect from "./ConversationSelect";

const StyledContainer = styled.div`
  height: 100vh;
  min-width: 300px;
  max-width: 400px;
  overflow-y: scroll;
  border-right: 1px solid whitesmoke;
  width: 400px;

  ::-webkit-scrollbar {
    display: none;
  }

  -ms-overflow-style: none;
  scrollbar-width: none;
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
  border-top: 1px solid whitesmoke;
  border-bottom: 1px solid whitesmoke;
`;

const StyledH3 = styled.h3`
  word-break: break-all;
`;

const Sidebar = () => {
  const [loggedInUser, _loading, _error] = useAuthState(auth);

  const [isOpenNewConversationDialog, setIsOpenNewConversationDialog] =
    useState(false);

  const [recipientEmail, setRecipientEmail] = useState("");

  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const [search, setSearcch] = useState("");

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
  const queryUserList = (recipientEmail: string) =>
    query(collection(db, "users"), where("email", "==", recipientEmail));
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
    if (!recipientEmail) return;

    if (EmailValidator.validate(recipientEmail) && isInvitingSelf) {
      showSnackbar("You cannot invite yourself");
    } else if (isConversationAlreadyExists(recipientEmail)) {
      showSnackbar("Conversation already exists");
    } else if (!isUsersExists(recipientEmail)) {
      showSnackbar("User does not exist");
    } else {
      await addDoc(collection(db, "conversations"), {
        users: [loggedInUser?.email, recipientEmail],
      });
      closeNewConversationDialog();
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
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

  return (
    <StyledContainer>
      <StyledHeader>
        <StyledUserAvatar src={loggedInUser?.photoURL || ""} />
        <StyledH3>{loggedInUser?.displayName as string}</StyledH3>

        <div>
          <IconButton>
            <ChatIcon />
          </IconButton>
          <IconButton>
            <MoreVerticalIcon />
          </IconButton>
          <IconButton onClick={logout}>
            <LogoutIcon />
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
        <ConversationSelect
          key={conversation.id}
          id={conversation.id}
          conversationUsers={(conversation.data() as Conversation).users}
        />
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
  );
};

export default Sidebar;
