import Sidebar from "../HRSidebar";
import Header from "../Header";
import { Outlet } from "react-router-dom";

const HrLayoutDashboard = () => {
    return (
        <div className="h-screen flex flex-col bg-background overflow-hidden font-sans">
            <Header />
            <div className="flex flex-1 overflow-hidden relative">
                <Sidebar />
                <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-gray-50/50 w-full transition-all duration-300">
                    <div className="max-w-[1600px] mx-auto">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};
export default HrLayoutDashboard;