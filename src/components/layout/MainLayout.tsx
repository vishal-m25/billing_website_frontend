
import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Package, FileText, Info, LogOut, Users, Receipt } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const isActive = (path: string) => {
    return location.pathname === path;

  };
  const handleLogout = () => {
    localStorage.removeItem("isAuthenticated");
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
    };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-app-blue-dark text-white p-4 shadow-md">
        <div className="container flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <Package size={28} />
            <h1 className="text-xl font-bold">Balakumat Automobiles</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm hidden md:inline">Billing & Inventory System</span>
            <Button variant="ghost" className="text-white" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>        </div>
      </header>

      <div className="flex flex-1">
          {/* Sidebar - Collapsible on mobile */}
          <aside className="w-64 bg-white shadow-md hidden md:block">
          <nav className="p-4 space-y-2">
            <Link
              to="/home"
              className={cn(
                "flex items-center space-x-3 p-3 rounded-md transition-colors",
                isActive("/")
                  ? "bg-app-blue text-white"
                  : "text-gray-700 hover:bg-app-blue-light hover:text-app-blue-dark"
              )}
            >
              <FileText size={20} />
              <span className="font-medium">Billing</span>
            </Link>
            <Link
              to="/inventory"
              className={cn(
                "flex items-center space-x-3 p-3 rounded-md transition-colors",
                isActive("/inventory")
                  ? "bg-app-blue text-white"
                  : "text-gray-700 hover:bg-app-blue-light hover:text-app-blue-dark"
              )}
            >
              <Package size={20} />
              <span className="font-medium">Inventory</span>
            </Link>
            <Link
              to="/customers"
              className={cn(
                "flex items-center space-x-3 p-3 rounded-md transition-colors",
                isActive("/customers")
                  ? "bg-app-blue text-white"
                  : "text-gray-700 hover:bg-app-blue-light hover:text-app-blue-dark"
              )}
            >
              <Users size={20} />
              <span className="font-medium">Customers</span>
            </Link>
            <Link
              to="/invoices"
              className={cn(
                "flex items-center space-x-3 p-3 rounded-md transition-colors",
                isActive("/invoices")
                  ? "bg-app-blue text-white"
                  : "text-gray-700 hover:bg-app-blue-light hover:text-app-blue-dark"
              )}
            >
              <Receipt size={20} />
              <span className="font-medium">Invoices</span>
            </Link>
          </nav>
          
        </aside>

        {/* Main content */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <div className="container max-w-7xl mx-auto">{children}</div>
        </main>
      </div>

      <footer className="bg-app-gray-dark text-white p-3 text-center text-sm hidden md:block">
         <div className="container">
          <p>© {new Date().getFullYear()} AutoParts Manager. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
