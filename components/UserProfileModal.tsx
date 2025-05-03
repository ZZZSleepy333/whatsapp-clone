import React, { useState, useRef, useCallback } from "react";
import styled from "styled-components";
import {
  Modal,
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
} from "@mui/material";
import { User } from "firebase/auth";
import ReactCrop, {
  Crop,
  PixelCrop,
  centerCrop,
  makeAspectCrop,
} from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { auth } from "../config/firebase";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";
import { doc, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "../config/firebase";

// Styled components
const StyledUserModal = styled(Paper)`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 400px;
  max-width: 90%;
  background-color: var(--conversation-bg);
  color: var(--text-color);
  border-radius: 8px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  outline: none;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);

  @media (max-width: 768px) {
    width: 90%;
  }
`;

const UserAvatarLarge = styled(Avatar)`
  width: 120px;
  height: 120px;
  margin-bottom: 20px;
  cursor: pointer;
  border: 3px solid var(--sender-message);
  transition: all 0.3s ease;

  &:hover {
    opacity: 0.8;
    transform: scale(1.05);
  }
`;

const UserInfoSection = styled.div`
  width: 100%;
  margin-bottom: 20px;
  text-align: center;
`;

const UserActionSection = styled.div`
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 10px;
`;

const HiddenFileInput = styled.input`
  display: none;
`;

const CropContainer = styled.div`
  width: 100%;
  max-height: 400px;
  overflow: hidden;
  margin-bottom: 20px;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
  border-radius: 8px;
`;

interface UserProfileModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null | undefined;
  showSnackbar: (message: string) => void;
}

// Hàm để tạo canvas từ ảnh đã cắt
function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop
): Promise<Blob> {
  const canvas = document.createElement("canvas");
  const scaleX = image.naturalWidth / image.width;
  const scaleY = image.naturalHeight / image.height;
  canvas.width = crop.width;
  canvas.height = crop.height;
  const ctx = canvas.getContext("2d");

  if (!ctx) {
    return Promise.reject("Không thể tạo canvas context");
  }

  ctx.drawImage(
    image,
    crop.x * scaleX,
    crop.y * scaleY,
    crop.width * scaleX,
    crop.height * scaleY,
    0,
    0,
    crop.width,
    crop.height
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Không thể tạo blob từ canvas"));
          return;
        }
        resolve(blob);
      },
      "image/jpeg",
      0.95
    );
  });
}

// Hàm để tạo crop mặc định (hình tròn ở giữa)
function centerAspectCrop(
  mediaWidth: number,
  mediaHeight: number,
  aspect: number
) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight
    ),
    mediaWidth,
    mediaHeight
  );
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({
  open,
  onClose,
  user,
  showSnackbar,
}) => {
  const [newAvatar, setNewAvatar] = useState<Blob | null>(null);
  const [newAvatarPreview, setNewAvatarPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [isCropDialogOpen, setIsCropDialogOpen] = useState(false);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [error, setError] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("profile"); // "profile" hoặc "password"

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropDialogOpen(true);
      });
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1));
    },
    []
  );

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const handleCropCancel = () => {
    setIsCropDialogOpen(false);
    setImageSrc(null);
  };

  const handleCropConfirm = async () => {
    if (imgRef.current && completedCrop) {
      try {
        const croppedImg = await getCroppedImg(imgRef.current, completedCrop);
        const previewUrl = URL.createObjectURL(croppedImg);
        setNewAvatar(croppedImg);
        setNewAvatarPreview(previewUrl);
        setIsCropDialogOpen(false);
      } catch (error) {
        console.error("Lỗi khi cắt ảnh:", error);
        showSnackbar("Có lỗi xảy ra khi xử lý ảnh");
      }
    }
  };

  // Hàm cập nhật avatar
  const handleUpdateAvatar = async () => {
    if (!newAvatar || !user) return;

    setIsUploading(true);
    try {
      // Tạo FormData để gửi file lên server
      const formData = new FormData();
      formData.append("file", newAvatar);
      
      // Gọi API upload đã có sẵn
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error("Lỗi khi tải ảnh lên Cloudinary");
      }
      
      const data = await response.json();
      const cloudinaryUrl = data.url;
      
      // Cập nhật profile trong Firebase Auth
      await updateProfile(user, {
        photoURL: cloudinaryUrl,
      });

      // Cập nhật thông tin trong Firestore
      await setDoc(
        doc(db, "users", user.email as string),
        {
          photoURL: cloudinaryUrl,
          lastSeen: serverTimestamp(),
        },
        { merge: true }
      );

      showSnackbar("Cập nhật avatar thành công");
      setNewAvatar(null);
      setNewAvatarPreview(null);
      onClose();
    } catch (error) {
      console.error("Lỗi cập nhật avatar:", error);
      showSnackbar("Có lỗi xảy ra khi cập nhật avatar");
    } finally {
      setIsUploading(false);
    }
  };

  // Hàm cập nhật mật khẩu
  const handleUpdatePassword = async () => {
    if (!user) return;

    setError("");

    // Kiểm tra mật khẩu
    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!currentPassword) {
      setError("Vui lòng nhập mật khẩu hiện tại");
      return;
    }

    setIsChangingPassword(true);

    try {
      // Xác thực lại người dùng trước khi đổi mật khẩu
      const credential = EmailAuthProvider.credential(
        user.email as string,
        currentPassword
      );

      await reauthenticateWithCredential(user, credential);

      // Cập nhật mật khẩu mới
      await updatePassword(user, password);

      showSnackbar("Cập nhật mật khẩu thành công");
      setPassword("");
      setConfirmPassword("");
      setCurrentPassword("");
      setActiveTab("profile");
    } catch (error: any) {
      console.error("Lỗi cập nhật mật khẩu:", error);
      if (error.code === "auth/wrong-password") {
        setError("Mật khẩu hiện tại không chính xác");
      } else {
        setError("Có lỗi xảy ra khi cập nhật mật khẩu");
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose}>
      <StyledUserModal>
        {isUploading && (
          <LoadingOverlay>
            <CircularProgress color="inherit" />
          </LoadingOverlay>
        )}

        <div style={{ width: "100%", marginBottom: "20px" }}>
          <Button
            variant={activeTab === "profile" ? "contained" : "outlined"}
            onClick={() => setActiveTab("profile")}
            style={{ marginRight: "10px" }}
          >
            Thông tin cá nhân
          </Button>
          <Button
            variant={activeTab === "password" ? "contained" : "outlined"}
            onClick={() => setActiveTab("password")}
          >
            Đổi mật khẩu
          </Button>
        </div>

        {activeTab === "profile" && (
          <>
            <UserAvatarLarge
              src={newAvatarPreview || user?.photoURL || ""}
              onClick={handleAvatarClick}
            />
            <Typography
              variant="caption"
              style={{ marginTop: -15, marginBottom: 15 }}
            >
              Nhấp vào ảnh để thay đổi
            </Typography>
            <HiddenFileInput
              type="file"
              accept="image/*"
              ref={fileInputRef}
              onChange={handleFileChange}
            />

            <UserInfoSection>
              <Typography variant="h5" gutterBottom>
                {user?.displayName}
              </Typography>
              <Typography variant="body1" color="textSecondary">
                {user?.email}
              </Typography>
            </UserInfoSection>

            <UserActionSection>
              {newAvatar && (
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  onClick={handleUpdateAvatar}
                  disabled={isUploading}
                >
                  {isUploading ? "Đang cập nhật..." : "Cập nhật avatar"}
                </Button>
              )}
              <Button
                variant="outlined"
                color="primary"
                fullWidth
                onClick={onClose}
              >
                Đóng
              </Button>
            </UserActionSection>
          </>
        )}

        {activeTab === "password" && (
          <UserActionSection>
            <TextField
              label="Mật khẩu hiện tại"
              type="password"
              fullWidth
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              margin="normal"
            />
            <TextField
              label="Mật khẩu mới"
              type="password"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
            />
            <TextField
              label="Xác nhận mật khẩu mới"
              type="password"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              margin="normal"
              error={password !== confirmPassword && confirmPassword !== ""}
              helperText={
                password !== confirmPassword && confirmPassword !== ""
                  ? "Mật khẩu không khớp"
                  : ""
              }
            />
            {error && (
              <Typography color="error" variant="body2">
                {error}
              </Typography>
            )}
            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleUpdatePassword}
              disabled={isChangingPassword}
            >
              {isChangingPassword ? "Đang cập nhật..." : "Cập nhật mật khẩu"}
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => setActiveTab("profile")}
            >
              Quay lại
            </Button>
          </UserActionSection>
        )}

        <Dialog open={isCropDialogOpen} onClose={handleCropCancel}>
          <DialogTitle>Cắt ảnh đại diện</DialogTitle>
          <DialogContent>
            <CropContainer>
              {imageSrc && (
                <ReactCrop
                  crop={crop}
                  onChange={(_, percentCrop) => setCrop(percentCrop)}
                  onComplete={handleCropComplete}
                  aspect={1}
                  circularCrop
                >
                  <img
                    ref={imgRef}
                    alt="Crop me"
                    src={imageSrc}
                    style={{ maxWidth: "100%" }}
                    onLoad={onImageLoad}
                  />
                </ReactCrop>
              )}
            </CropContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCropCancel}>Hủy</Button>
            <Button onClick={handleCropConfirm} color="primary">
              Xác nhận
            </Button>
          </DialogActions>
        </Dialog>
      </StyledUserModal>
    </Modal>
  );
};

export default UserProfileModal;
