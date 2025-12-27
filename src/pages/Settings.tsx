function Settings() {
    return (
        <div className="p-6 min-h-screen max-h-130 overflow-y-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-300 mb-6">Account Settings</h1>
            <div className="space-y-6">
                {/* Profile Information Section */}
                <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300 mb-4">Profile Information</h2>
                    <form className="space-y-4">
                        <div>
                            <label htmlFor="fullName" className="block text-gray-700 dark:text-gray-300 mb-1">Full Name</label>
                            <input
                                id="fullName"
                                type="text"
                                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                placeholder="Enter your full name"
                            />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-gray-700 dark:text-gray-300 mb-1">Email Address</label>
                            <input
                                id="email"
                                type="email"
                                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                placeholder="Enter your email"
                                autoComplete="email"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            Save Changes
                        </button>
                    </form>
                </div>

                {/* Password Update Section */}
                <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300 mb-4">Update Password</h2>
                    <form className="space-y-4">
                        <input id="username" autoComplete="username" type="text" hidden />
                        <div>
                            <label htmlFor="currentPassword" className="block text-gray-700 dark:text-gray-300 mb-1">Current Password</label>
                            <input
                                id="currentPassword"
                                type="password"
                                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                placeholder="Enter current password"
                                autoComplete="current-password"
                            />
                        </div>
                        <div>
                            <label htmlFor="newPassword" className="block text-gray-700 dark:text-gray-300 mb-1">New Password</label>
                            <input
                                id="newPassword"
                                type="password"
                                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                placeholder="Enter new password"
                                autoComplete="new-password"
                            />
                        </div>
                        <div>
                            <label htmlFor="confirmNewPassword" className="block text-gray-700 dark:text-gray-300 mb-1">Confirm New Password</label>
                            <input
                                id="confirmNewPassword"
                                type="password"
                                className="w-full p-2 border rounded dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300"
                                placeholder="Confirm new password"
                                autoComplete="new-password"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            Update Password
                        </button>
                    </form>
                </div>

                {/* Notification Preferences Section */}
                <div className="shadow-md bg-white dark:bg-gray-900 rounded p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-300 mb-4">Notification Preferences</h2>
                    <form className="space-y-4">
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="emailNotifications"
                                className="mr-2"
                            />
                            <label htmlFor="emailNotifications" className="text-gray-700 dark:text-gray-300">
                                Email Notifications
                            </label>
                        </div>
                        <div className="flex items-center">
                            <input
                                type="checkbox"
                                id="smsNotifications"
                                className="mr-2"
                            />
                            <label htmlFor="smsNotifications" className="text-gray-700 dark:text-gray-300">
                                SMS Notifications
                            </label>
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
                        >
                            Save Preferences
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Settings;
