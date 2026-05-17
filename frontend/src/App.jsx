import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import Home from "./pages/Home";
import UserPage from "./pages/UserPage";
import Analytics from "./pages/Analytics";

const theme = createTheme({
  fontFamily: "'Inter', system-ui, sans-serif",
  primaryColor: "orange",
  defaultRadius: "md",
  colors: {
    dark: ["#f4f4f5", "#a1a1aa", "#71717a", "#52525b", "#3f3f46", "#27272a", "#18181b", "#09090b", "#09090b", "#09090b"],
  },
});

const API = "http://localhost:5000/api";

export default function App() {
  return (
    <MantineProvider theme={theme} defaultColorScheme="dark">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home api={API} />} />
          <Route path="/user/:userId" element={<UserPage api={API} />} />
          <Route path="/analytics" element={<Analytics api={API} />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}
