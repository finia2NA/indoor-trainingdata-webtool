import { createTheme } from '@mui/material/styles';

// @ts-expect-error idc
import tailwindConfig from "../tailwind.config"
const colors = tailwindConfig.theme.extend.colors
debugger;


const theme = createTheme({
  palette: {
    primary: {
      main: colors.orangeweb.DEFAULT,
    },
    secondary: {
      main: colors.tropical_indigo.DEFAULT,
    },
    background: {
      default: colors.oxford_blue.DEFAULT,
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