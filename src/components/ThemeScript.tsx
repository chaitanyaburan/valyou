import Script from "next/script";
import { THEME_STORAGE_KEY } from "@/lib/theme";

const boot = `
(function(){
  try {
    var t = localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)});
    if (t === "light") document.documentElement.classList.add("light");
    else document.documentElement.classList.remove("light");
  } catch (e) {}
})();
`;

export default function ThemeScript() {
  return <Script id="valyou-theme-init" strategy="beforeInteractive" dangerouslySetInnerHTML={{ __html: boot }} />;
}
