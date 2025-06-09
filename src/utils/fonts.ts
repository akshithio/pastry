import localFont from "next/font/local";

export const saans = localFont({
  src: "../../public/fonts/SaansVF.ttf",
  variable: "--font-saans",
  display: "swap",
});

export const family = localFont({
  src: [
    {
      path: "../../public/fonts/Family-Black.otf",
      weight: "800",
      style: "normal",
    },
    {
      path: "../../public/fonts/Family-BlackItalic.otf",
      weight: "800",
      style: "italic",
    },
    {
      path: "../../public/fonts/Family-Bold.otf",
      weight: "700",
      style: "normal",
    },
    {
      path: "../../public/fonts/Family-BoldItalic.otf",
      weight: "700",
      style: "italic",
    },
    {
      path: "../../public/fonts/Family-Italic.otf",
      weight: "400",
      style: "italic",
    },
    {
      path: "../../public/fonts/Family-Regular.otf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/fonts/Family-Light.otf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/fonts/Family-LightItalic.otf",
      weight: "300",
      style: "italic",
    },
    {
      path: "../../public/fonts/Family-Medium.otf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/fonts/Family-MediumItalic.otf",
      weight: "500",
      style: "italic",
    },
  ],
  variable: "--font-family",
  display: "swap",
});
