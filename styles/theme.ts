export const lightTheme = {
  body: '#ffffff',
  text: '#000000',
  background: '#ffffff',
  conversationBg: '#ffffff',
  messageBg: '#e5ded8',
  senderMessage: '#dcf8c6',
  receiverMessage: 'whitesmoke',
  inputBg: 'whitesmoke',
  border: 'whitesmoke',
  shadow: 'rgba(0, 0, 0, 0.2)',
  headerBg: '#ffffff',
  iconColor: '#555',
  filePreviewBg: '#444444',
  filePreviewBorder: '#555555',
  filePreviewText: '#ffffff',
  filePreviewSubtext: '#aaaaaa',
};

export const darkTheme = {
  body: '#121212',
  text: '#ffffff',
  background: '#121212',
  conversationBg: '#1f1f1f',
  messageBg: '#262d31',
  senderMessage: '#056162',
  receiverMessage: '#262d31',
  inputBg: '#323739',
  border: '#323739',
  shadow: 'rgba(0, 0, 0, 0.4)',
  headerBg: '#1f1f1f',
  iconColor: '#aaaaaa',
  filePreviewBg: '#323739',
  filePreviewBorder: '#056162',
  filePreviewText: '#ffffff',
  filePreviewSubtext: '#aaaaaa',
};

export type ThemeType = typeof lightTheme;