import { createGlobalStyle } from 'styled-components';
import { ThemeType } from './theme';

const GlobalStyle = createGlobalStyle<{ theme: ThemeType }>`
  body {
    background-color: ${({ theme }) => theme.body};
    color: ${({ theme }) => theme.text};
    transition: all 0.3s ease;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  * {
    box-sizing: border-box;
  }
`;

export default GlobalStyle;