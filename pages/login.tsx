import { useState } from "react";
import Button from "@mui/material/Button";
import Head from "next/head";
import styled from "styled-components";
import Image from "next/image";
import WhatsAppLogo from "../assets/whatsapplogo.png";
import { useSignInWithGoogle } from "react-firebase-hooks/auth";
import { auth, db } from "../config/firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { TextField, Typography, Tabs, Tab, Box, Divider } from "@mui/material";

const StyledContainer = styled.div`
  height: 100vh;
  display: grid;
  place-items: center;
  background: url("https://t3.ftcdn.net/jpg/03/27/51/56/360_F_327515607_Hcps04aaEc7Ki43d1XZPxwcv0ZaIaorh.jpg");
`;

const StyledLoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
  background-color: white;
  border-radius: 5px;
  box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
  width: 400px;
`;

const StyledImageWrapper = styled.div`
  margin-bottom: 30px;
`;

const StyledForm = styled.form`
  display: flex;
  flex-direction: column;
  width: 100%;
  gap: 15px;
  margin-top: 20px;
`;

const StyledDivider = styled(Divider)`
  width: 100%;
  margin: 20px 0;
`;

const StyledErrorMessage = styled(Typography)`
  color: #d32f2f;
  font-size: 14px;
  margin-top: 5px;
`;

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`auth-tabpanel-${index}`}
      aria-labelledby={`auth-tab-${index}`}
      {...other}
      style={{ width: "100%" }}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

// Hàm tạo avatar từ chữ cái đầu tiên của tên
const generateAvatarUrl = (displayName: string) => {
  const initial = displayName.charAt(0).toUpperCase();
  const colors = [
    "1abc9c",
    "2ecc71",
    "3498db",
    "9b59b6",
    "e74c3c",
    "f1c40f",
    "e67e22",
    "34495e",
    "16a085",
    "27ae60",
  ];

  // Chọn màu ngẫu nhiên
  const colorIndex = Math.floor(Math.random() * colors.length);
  const color = colors[colorIndex];

  return `https://ui-avatars.com/api/?name=${initial}&background=${color}&color=fff&size=200`;
};

const Login = () => {
  const [signInWithGoogle, _user, _loading, _error] = useSignInWithGoogle(auth);
  const [tabValue, setTabValue] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setError("");
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // Thêm chuyển hướng sau khi đăng nhập với Google thành công
      window.location.href = '/';
    } catch (error) {
      console.error("Lỗi đăng nhập với Google:", error);
      setError("Đã xảy ra lỗi khi đăng nhập với Google. Vui lòng thử lại sau.");
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Kiểm tra xem người dùng đã có dữ liệu trong Firestore chưa
      const userDoc = doc(db, "users", user.email as string);
      const userSnapshot = await getDoc(userDoc);

      // Nếu chưa có dữ liệu trong Firestore, tạo mới
      if (!userSnapshot.exists() && user.displayName) {
        await setDoc(userDoc, {
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL || generateAvatarUrl(user.displayName),
          lastSeen: serverTimestamp(),
        });
      }
      
      // Thêm chuyển hướng sau khi đăng nhập thành công
      window.location.href = '/';
    } catch (error: any) {
      console.error("Lỗi đăng nhập:", error);
      if (error.code === "auth/user-not-found") {
        setError(
          "Email này chưa được đăng ký. Vui lòng đăng ký trước khi đăng nhập."
        );
      } else if (error.code === "auth/wrong-password") {
        setError("Mật khẩu không chính xác");
      } else if (error.code === "auth/too-many-requests") {
        setError("Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau");
      } else if (error.code === "auth/user-disabled") {
        setError("Tài khoản này đã bị vô hiệu hóa");
      } else if (error.code === "auth/invalid-email") {
        setError("Email không hợp lệ");
      } else if (error.code === "auth/network-request-failed") {
        setError(
          "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn."
        );
      } else {
        setError(
          `Đã xảy ra lỗi khi đăng nhập: ${
            error.message || "Vui lòng thử lại sau."
          }`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!displayName.trim()) {
      setError("Vui lòng nhập tên hiển thị");
      return;
    }

    if (password !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    if (password.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    setIsLoading(true);

    try {
      // Tạo avatar từ chữ cái đầu tiên của tên
      const photoURL = generateAvatarUrl(displayName);

      // Tạo tài khoản mới
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      // Cập nhật thông tin profile
      await updateProfile(user, {
        displayName,
        photoURL,
      });

      // Lưu thông tin người dùng vào Firestore
      await setDoc(doc(db, "users", user.email as string), {
        email: user.email,
        displayName,
        photoURL,
        lastSeen: serverTimestamp(),
      });

      // Xóa dữ liệu đã nhập sau khi đăng ký thành công
      setEmail("");
      setPassword("");
      setDisplayName("");
      setConfirmPassword("");

      // Chuyển về tab đăng nhập
      setTabValue(0);

      // Hiển thị thông báo thành công
      alert("Đăng ký thành công! Vui lòng đăng nhập.");
    } catch (error: any) {
      console.error("Lỗi đăng ký:", error);

      // Xử lý chi tiết hơn cho lỗi email đã tồn tại
      if (error.code === "auth/email-already-in-use") {
        try {
          // Kiểm tra xem email có trong Firestore không
          const userDoc = doc(db, "users", email);
          const userSnapshot = await getDoc(userDoc);
          
          if (userSnapshot.exists()) {
            // Email tồn tại trong Firestore
            const userData = userSnapshot.data();
            console.log("Email đã tồn tại trong Firestore:", userData.email);
            setError(
              `Email này đã được đăng ký bởi ${userData.displayName || "người dùng khác"}. Bạn có thể thử đăng nhập hoặc sử dụng email khác.`
            );
          } else {
            // Email tồn tại trong Authentication nhưng không có trong Firestore
            console.log("Email tồn tại trong Authentication nhưng không có trong Firestore:", email);
            setError(
              "Email này đã được đăng ký nhưng chưa hoàn tất thiết lập. Bạn có thể thử đăng nhập hoặc sử dụng email khác."
            );
          }
        } catch (checkError) {
          // Lỗi khi kiểm tra Firestore
          console.error("Lỗi khi kiểm tra Firestore:", checkError);
          setError(
            "Email này đã được đăng ký. Bạn có thể thử đăng nhập hoặc sử dụng email khác."
          );
        }
        
        // Tự động chuyển sang tab đăng nhập và điền sẵn email
        setTabValue(0);
        // Giữ nguyên email để người dùng có thể đăng nhập luôn
        setPassword("");
      } else if (error.code === "auth/operation-not-allowed") {
        setError(
          "Phương thức đăng ký bằng email/mật khẩu chưa được bật trong Firebase"
        );
      } else if (error.code === "auth/weak-password") {
        setError("Mật khẩu quá yếu. Vui lòng chọn mật khẩu mạnh hơn");
      } else if (error.code === "auth/invalid-email") {
        setError("Email không hợp lệ");
      } else if (error.code === "auth/network-request-failed") {
        setError(
          "Lỗi kết nối mạng. Vui lòng kiểm tra kết nối internet của bạn."
        );
      } else {
        setError(
          `Đã xảy ra lỗi khi đăng ký: ${
            error.message || "Vui lòng thử lại sau."
          }`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <StyledContainer>
      <Head>
        <title>Đăng nhập</title>
      </Head>

      <StyledLoginContainer>
        <StyledImageWrapper>
          <Image
            src={WhatsAppLogo}
            alt="Whatsapp Logo"
            height="100px"
            width="100px"
          />
        </StyledImageWrapper>

        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="fullWidth"
          sx={{ width: "100%" }}
        >
          <Tab label="Đăng nhập" />
          <Tab label="Đăng ký" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <StyledForm onSubmit={handleSignIn}>
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Mật khẩu"
              type="password"
              variant="outlined"
              fullWidth
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            {error && <StyledErrorMessage>{error}</StyledErrorMessage>}
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
              disabled={isLoading}
              sx={{ color: 'white' }}
            >
              {isLoading ? "Đang đăng nhập..." : "Đăng nhập"}
            </Button>
          </StyledForm>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <StyledForm onSubmit={handleSignUp}>
            <TextField
              label="Tên hiển thị"
              type="text"
              variant="outlined"
              fullWidth
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <TextField
              label="Email"
              type="email"
              variant="outlined"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <TextField
              label="Mật khẩu"
              type="password"
              variant="outlined"
              fullWidth
              value={password} // Thêm mật khẩu vào dữ liệu lưu trữ
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <TextField
              label="Xác nhận mật khẩu"
              type="password"
              variant="outlined"
              fullWidth
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              error={password !== confirmPassword && confirmPassword !== ""}
              helperText={
                password !== confirmPassword && confirmPassword !== ""
                  ? "Mật khẩu không khớp"
                  : ""
              }
            />
            {error && <StyledErrorMessage>{error}</StyledErrorMessage>}
            <Button
              variant="contained"
              color="primary"
              type="submit"
              fullWidth
              disabled={isLoading}
              sx={{ color: 'white' }}
            >
              {isLoading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>
          </StyledForm>
        </TabPanel>

        <StyledDivider>Hoặc</StyledDivider>

        <Button 
          variant="outlined" 
          onClick={handleGoogleSignIn} 
          fullWidth
          sx={{ color: '#1976d2' }}
        >
          Đăng nhập với Google
        </Button>
      </StyledLoginContainer>
    </StyledContainer>
  );
};

export default Login;
