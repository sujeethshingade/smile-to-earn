import { Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/Theme";

export const ThemeToggle: React.FC = () => {
  const themeContext = useTheme();
  if (!themeContext) {
    return null;
  }
  const { theme, toggleTheme } = themeContext;
  const isDark = theme === "dark";

  return (
    <div className="flex items-center gap-2">
      <div 
        onClick={toggleTheme}
        className={`
          w-20 h-[42px] rounded-md p-[5px] cursor-pointer
          transition-colors duration-300 ease-in-out
          ${isDark ? 'bg-slate-800' : 'bg-slate-200'}
          relative
        `}
      >
        <div
          className={`
            absolute w-8 h-8 rounded-md
            transition-transform duration-300 ease-in-out
            flex items-center justify-center
            ${isDark ? 'translate-x-[38px] bg-black' : 'translate-x-0 bg-white'}
          `}
        >
          {isDark ? (
            <Moon className="w-5 h-5 text-white" />
          ) : (
            <Sun className="w-5 h-5 text-yellow-500" />
          )}
        </div>
      </div>
    </div>
  );
}