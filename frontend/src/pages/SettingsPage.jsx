import { useThemeStore } from "../store/useTHEMEStore";
import { Moon, Sun } from "lucide-react";

const SettingsPage = () => {
  const { theme, setTheme } = useThemeStore();

  return (
    <div className="min-h-screen container mx-auto px-4 pt-20">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Appearance</h1>
        
        <div className="flex gap-4">
          <button
            onClick={() => setTheme("light")}
            className={`flex-1 flex flex-col items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              theme === "light" ? "border-primary bg-base-200" : "border-base-content/20 hover:border-base-content/40"
            }`}
          >
            <Sun className="w-8 h-8" />
            <span className="font-medium">Light</span>
          </button>

          <button
            onClick={() => setTheme("dark")}
            className={`flex-1 flex flex-col items-center gap-4 p-4 rounded-lg border-2 transition-all ${
              theme === "dark" ? "border-primary bg-base-200" : "border-base-content/20 hover:border-base-content/40"
            }`}
          >
            <Moon className="w-8 h-8" />
            <span className="font-medium">Dark</span>
          </button>
        </div>

        <p className="mt-4 text-base-content/70 text-sm">
          Choose how Chatty looks on your device. You can switch between light and dark modes.
        </p>
      </div>
    </div>
  );
};

export default SettingsPage;
