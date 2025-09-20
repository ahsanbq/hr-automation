import "@/styles/globals.css";
import type { AppProps } from "next/app";
import { ConfigProvider } from "antd";

export default function App({ Component, pageProps }: AppProps) {
  return (
    <ConfigProvider theme={{ token: { colorPrimary: "#1677ff" } }}>
      <Component {...pageProps} />
    </ConfigProvider>
  );
}
