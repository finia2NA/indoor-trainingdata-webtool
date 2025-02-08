import { createTheme } from '@mui/material/styles';

// @ts-expect-error idc
import tailwindConfig from "../tailwind.config"
const colors = tailwindConfig.theme.extend.colors


const theme = createTheme({
  palette: {
    primary: {
      main: colors.primary.DEFAULT,
    },
    secondary: {
      main: colors.secondary.DEFAULT,
    },
    background: {
      default: colors.bg.DEFAULT,
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h1: {
      fontSize: '2rem',
    },
  },
});

export default theme;