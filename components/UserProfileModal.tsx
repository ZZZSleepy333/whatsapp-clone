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
import { updateProfile } from "firebase/auth";

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

  const handleAvatarClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];

      // Tạo URL cho ảnh đã chọn
      const reader = new FileReader();
      reader.onload = (e) => {
        if (e.target && e.target.result) {
          setImageSrc(e.target.result as string);
          setIsCropDialogOpen(true);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, 1)); // Tỷ lệ 1:1 cho avatar hình tròn
    },
    []
  );

  const handleCropComplete = (crop: PixelCrop) => {
    setCompletedCrop(crop);
  };

  const handleCropCancel = () => {
    setIsCropDialogOpen(false);
    setImageSrc(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleCropConfirm = async () => {
    if (imgRef.current && completedCrop) {
      try {
        const croppedImageBlob = await getCroppedImg(
          imgRef.current,
          completedCrop
        );
        const croppedImageUrl = URL.createObjectURL(croppedImageBlob);
        setNewAvatarPreview(croppedImageUrl);
        setNewAvatar(croppedImageBlob);
        setIsCropDialogOpen(false);

        showSnackbar("Đã cắt ảnh thành công");
      } catch (error) {
        console.error("Lỗi khi cắt ảnh:", error);
        showSnackbar("Có lỗi xảy ra khi cắt ảnh");
      }
    }
  };

  const uploadToCloudinary = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", "whatsapp_clone"); // Thay thế bằng upload preset của bạn

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error("Lỗi khi upload lên Cloudinary");
      }

      const data = await response.json();
      return data.secure_url;
    } catch (error) {
      console.error("Lỗi upload:", error);
      throw error;
    }
  };

  const handleUpdateProfile = async () => {
    if (newAvatar) {
      setIsUploading(true);
      try {
        // Upload ảnh lên Cloudinary
        const imageUrl = await uploadToCloudinary(newAvatar);

        // Cập nhật photoURL trong Firebase Authentication
        if (auth.currentUser) {
          await updateProfile(auth.currentUser, {
            photoURL: imageUrl,
          });

          showSnackbar("Cập nhật avatar thành công");
        }
      } catch (error) {
        console.error("Lỗi khi cập nhật avatar:", error);
        showSnackbar("Có lỗi xảy ra khi cập nhật avatar");
      } finally {
        setIsUploading(false);
        onClose();
      }
    } else if (password && confirmPassword) {
      showSnackbar("Chức năng đổi mật khẩu đang được phát triển");
      onClose();
    } else {
      onClose();
    }
  };

  return (
    <>
      <Modal
        open={open}
        onClose={onClose}
        aria-labelledby="user-profile-modal"
        aria-describedby="user-profile-information"
      >
        <StyledUserModal>
          {isUploading && (
            <LoadingOverlay>
              <CircularProgress color="inherit" />
            </LoadingOverlay>
          )}

          <Typography variant="h5" component="h2" gutterBottom>
            Thông tin người dùng
          </Typography>

          <HiddenFileInput
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileChange}
          />

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

          <UserInfoSection>
            <Typography variant="h6">{user?.displayName}</Typography>
            <Typography variant="body2" color="textSecondary">
              {user?.email}
            </Typography>
          </UserInfoSection>

          <UserActionSection>
            <TextField
              label="Mật khẩu mới"
              type="password"
              variant="outlined"
              fullWidth
              size="small"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <TextField
              label="Xác nhận mật khẩu"
              type="password"
              variant="outlined"
              fullWidth
              size="small"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={password !== confirmPassword && confirmPassword !== ""}
              helperText={
                password !== confirmPassword && confirmPassword !== ""
                  ? "Mật khẩu không khớp"
                  : ""
              }
            />

            <Button
              variant="contained"
              color="primary"
              fullWidth
              onClick={handleUpdateProfile}
              style={{ marginTop: 10 }}
              disabled={
                isUploading || (password !== "" && password !== confirmPassword)
              }
            >
              {isUploading ? "Đang cập nhật..." : "Cập nhật thông tin"}
            </Button>
          </UserActionSection>
        </StyledUserModal>
      </Modal>

      {/* Dialog để cắt ảnh */}
      <Dialog
        open={isCropDialogOpen}
        onClose={handleCropCancel}
        maxWidth="md"
        PaperProps={{
          style: {
            backgroundColor: "var(--conversation-bg)",
            color: "var(--text-color)",
          },
        }}
      >
        <DialogTitle>Cắt ảnh đại diện</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Di chuyển và điều chỉnh khung để chọn phần ảnh làm avatar
          </Typography>
          <CropContainer>
            {imageSrc && (
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={handleCropComplete}
                aspect={1}
                circularCrop
              >
                <img
                  ref={imgRef}
                  src={imageSrc}
                  alt="Ảnh để cắt"
                  style={{ maxWidth: "100%", maxHeight: "400px" }}
                  onLoad={onImageLoad}
                />
              </ReactCrop>
            )}
          </CropContainer>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCropCancel} color="error">
            Hủy
          </Button>
          <Button
            onClick={handleCropConfirm}
            color="primary"
            disabled={!completedCrop}
          >
            Xác nhận
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default UserProfileModal;
