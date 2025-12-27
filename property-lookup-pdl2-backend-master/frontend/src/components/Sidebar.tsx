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
        <aside className="bg-white dark:bg-gray-900 w-64 h-screen p-4 shadow-lg">
            <img className='block dark:hidden mb-4 w-32 h-auto' src="https://4pm.ie/assets/4property-logo-black.png" alt="4Property Logo" />
            <img className='hidden dark:block mb-4 w-32 h-auto' src="            https://www.4property.com/wp-content/uploads/2019/10/4property-logo.png
" alt="4Property Logo" />
            <ul className="space-y-2">
                <li>
                    <Link
                        to="/dashboard"
                        className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/dashboard' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300 '}`}
                    >
                        <FaHome size={20} />
                        <span>Dashboard</span>
                    </Link>
                </li>
                <li>
                    <Link
                        to="/agencies"
                        className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/agencies' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300 '}`}
                    >


                        <CiViewTable size={20} />
                        <span>Agencies</span>
                    </Link>
                </li>


                {enableAuth && (
                    <>
                        <li>
                            <Link
                                to="/datamanagment"
                                className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/datamanagment' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300'}`}
                            >
                                <AiOutlineDatabase size={20} />
                                <span>Data Management</span>
                            </Link>
                        </li>

                        <li>
                            <Link to="/settings" className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/settings' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300'}`}>
                                <IoIosSettings size={20} />
                                <span>Settings</span>
                            </Link>
                        </li>
                        <li>
                            <a
                                href="/logout"
                                onClick={handleLogout}
                                className={`rounded p-2 text-xl flex items-center space-x-2 ${activePage === '/logout' ? 'bg-purple-200 text-purple-500 font-medium dark:text-gray-100 dark:bg-gray-800' : 'text-gray-500  dark:text-gray-300'}`}
                            >
                                <MdLogout size={20} />
                                <span>Logout</span>
                            </a>
                        </li>
                    </>
                )}

            </ul>
        </aside>
    );
};

export default Sidebar;