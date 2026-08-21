import { useEffect } from "react";
import useLocalStorageState from "@/hooks/useLocalStorageState";

export function UseMode() {
  const [theme, setTheme] = useLocalStorageState<"light" | "dark">(
    "theme",
    () => "dark",
    {
      raw: true,
      deserialize: (value) => (value === "light" ? "light" : "dark"),
    }
  );

  const isLight = theme === "light";
  const setIsLight = (value: boolean) => setTheme(value ? "light" : "dark");

  useEffect(() => {
    const root = document.documentElement;
    const nextTheme = isLight ? "light" : "dark";

    root.setAttribute("data-theme", nextTheme);
    root.style.colorScheme = nextTheme;

    const computed = getComputedStyle(root)
      .getPropertyValue("--color-bg")
      .trim();

    if (computed) {
      let meta = document.querySelector('meta[name="theme-color"]');
      if (!meta) {
        meta = document.createElement("meta");
        meta.name = "theme-color";
        document.head.appendChild(meta);
      }
      meta.setAttribute("content", computed);
    }
  }, [isLight]);

  return [isLight, setIsLight] as const;
}
