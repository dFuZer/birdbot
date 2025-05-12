import { Inter, Katibeh, Roboto_Mono } from "next/font/google";

export const katibehFont = Katibeh({ subsets: ["latin"], weight: ["400"] });
export const interFont = Inter({ subsets: ["latin"], weight: ["100", "200", "300", "400", "500", "600", "700", "800", "900"] });
export const robotoMonoFont = Roboto_Mono({
    subsets: ["latin"],
    weight: ["100", "200", "300", "400", "500", "600", "700"],
});
