import { FaHome } from "react-icons/fa";
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CiViewTable } from "react-icons/ci";
import { IoIosSettings } from "react-icons/io";
import { MdLogout } from "react-icons/md";
import { AiOutlineDatabase } from "react-icons/ai"; // Import icon for Data Management

const Sidebar: React.FC = () => {
    const location = useLocation();
    const activePage = location.pathname;
    const enableAuth = import.meta.env.VITE_REACT_ENABLE_AUTH === 'true';

    const handleLogout = (e: React.MouseEvent<HTMLAnchorElement, MouseEvent>) => {
        e.preventDefault();
        const confirmLogout = window.confirm("Are you sure you want to log out?");
        if (confirmLogout) {
            window.location.href = "/logout";
        }
    };

    return (
        <aside className="bg-white dark:bg-gray-900 w-64 h-screen p-5 shadow-xl border-r border-gray-100 dark:border-gray-800 flex flex-col">
            <div className="mb-8">
                <img className='block dark:hidden w-36 h-auto' src="https://4pm.ie/assets/4property-logo-black.png" alt="4Property Logo" />
                <img className='hidden dark:block w-36 h-auto' src="https://www.4property.com/wp-content/uploads/2019/10/4property-logo.png" alt="4Property Logo" />
            </div>
            <nav className="flex-1">
                <ul className="space-y-1">
                    <li>
                        <Link
                            to="/dashboard"
                            className={`rounded-lg px-3 py-2.5 text-base flex items-center space-x-3 transition-all duration-200 ${
                                activePage === '/dashboard'
                                    ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <FaHome size={18} />
                            <span>Dashboard</span>
                        </Link>
                    </li>
                    <li>
                        <Link
                            to="/agencies"
                            className={`rounded-lg px-3 py-2.5 text-base flex items-center space-x-3 transition-all duration-200 ${
                                activePage === '/agencies'
                                    ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                            }`}
                        >
                            <CiViewTable size={18} />
                            <span>Agencies</span>
                        </Link>
                    </li>

                    {enableAuth && (
                        <>
                            <li>
                                <Link
                                    to="/datamanagment"
                                    className={`rounded-lg px-3 py-2.5 text-base flex items-center space-x-3 transition-all duration-200 ${
                                        activePage === '/datamanagment'
                                            ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <AiOutlineDatabase size={18} />
                                    <span>Data Management</span>
                                </Link>
                            </li>

                            <li>
                                <Link
                                    to="/settings"
                                    className={`rounded-lg px-3 py-2.5 text-base flex items-center space-x-3 transition-all duration-200 ${
                                        activePage === '/settings'
                                            ? 'bg-blue-50 text-blue-700 font-semibold dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    <IoIosSettings size={18} />
                                    <span>Settings</span>
                                </Link>
                            </li>
                            <li className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                                <a
                                    href="/logout"
                                    onClick={handleLogout}
                                    className="rounded-lg px-3 py-2.5 text-base flex items-center space-x-3 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-all duration-200"
                                >
                                    <MdLogout size={18} />
                                    <span>Logout</span>
                                </a>
                            </li>
                        </>
                    )}
                </ul>
            </nav>
        </aside>
    );
};

export default Sidebar;