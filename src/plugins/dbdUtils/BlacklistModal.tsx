/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { localStorage } from "@utils/localStorage";
import {
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalRoot,
    ModalSize,
    openModal
} from "@utils/modal";
import { Button, Text, useEffect, UserUtils, useState } from "@webpack/common";

import { openBlacklistReasonModal } from "./BlacklistReasonModal";
import { banUser, blacklist, clearLocalStorage, inAChannel } from "./functions";
import { UserData } from "./interfaces";
import { Settings } from "./util";

function ModalComponent(props) {
    const [blacklistedUsers, setBlacklistedUsers] = useState<UserData[]>([]);
    const [bannedUsers, setBannedUsers] = useState<UserData[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
    useEffect(() => {
        if (!inAChannel) {
            clearLocalStorage();
        }

        const fetchUsers = async () => {
            const fetchedBlacklistedUsers = await Promise.all(
                Settings.store.blacklist
                    ?.split(" ")
                    .map(async id => {
                        const userInfo = await getUserInfo(id);
                        return userInfo;
                    })
                    .filter(user => user !== null) || []
            );
            fetchedBlacklistedUsers.sort((a, b) => (a!.globalname || "").localeCompare(b!.globalname || ""));
            setBlacklistedUsers(fetchedBlacklistedUsers as UserData[]);

            const fetchedBannedUsers = await Promise.all(
                localStorage.getItem("dbd-lfg-banned-users")
                    ?.split(" ")
                    .map(async id => {
                        const userInfo = await getUserInfo(id);
                        return userInfo;
                    })
                    .filter(user => user !== null) || []
            );
            fetchedBannedUsers.sort((a, b) => (a!.globalname || "").localeCompare(b!.globalname || ""));
            setBannedUsers(fetchedBannedUsers as UserData[]);
        };

        if (Settings.store.blacklist && Settings.store.blacklist.split(" ").length > 0) {
            fetchUsers();
        }
    }, []);

    const getUserInfo = async (id: string) => {
        try {
            const user = await UserUtils.getUser(id);
            if (user) {
                return {
                    id: id,
                    username: user.username,
                    globalname: user.globalName || null,
                    avatar: user.getAvatarURL()
                };
            }
            return null;
        } catch (error) {
            console.error(error);
            return null;
        }
    };

    const handleUserSelect = (userId: string) => {
        const newSelectedUsers = new Set(selectedUsers);
        if (newSelectedUsers.has(userId)) {
            newSelectedUsers.delete(userId);
        } else {
            newSelectedUsers.add(userId);
        }
        setSelectedUsers(newSelectedUsers);
    };

    const handleSelectAll = () => {
        if (selectedUsers.size === blacklistedUsers.length) {
            setSelectedUsers(new Set());
        } else {
            const newSelectedUsers = new Set(blacklistedUsers.map(user => user.id));
            setSelectedUsers(newSelectedUsers);
        }
    };

    const handleBanSelected = () => {
        const selectedIds = Array.from(selectedUsers).join(" ");
        if (selectedIds.length > 0) {
            banUser(selectedIds, "153566829380370432");
            setSelectedUsers(new Set());
        }
    };

    const handleAutoBanSelected = () => {
        const selectedIds = Array.from(selectedUsers);
        if (selectedIds.length > 0) {
            const autoBannedUsers = localStorage.getItem("dbd-lfg-autoban-users") || "";
            const autoBannedUsersArray = autoBannedUsers.split(" ").filter(Boolean);
            const isAnyBanned = selectedIds.some(id => autoBannedUsersArray.includes(id));

            if (isAnyBanned) {
                const updatedAutoBannedUsers = autoBannedUsersArray.filter(id => !selectedIds.includes(id));
                localStorage.setItem("dbd-lfg-autoban-users", updatedAutoBannedUsers.join(" "));
            } else {
                const updatedAutoBannedUsers = [...autoBannedUsersArray, ...selectedIds];
                localStorage.setItem("dbd-lfg-autoban-users", updatedAutoBannedUsers.join(" "));
            }
            setSelectedUsers(new Set());
        }
    };

    const handleBlacklist = () => {
        const selectedIds = Array.from(selectedUsers);

        const bannedUserIds = bannedUsers.map(user => user.id);
        const blacklistedUserIds = blacklistedUsers.map(user => user.id);

        const usersToBlacklist = selectedIds.filter(userId =>
            bannedUserIds.includes(userId) && !blacklistedUserIds.includes(userId)
        );

        const usersAlreadyBlacklisted = selectedIds.filter(userId =>
            blacklistedUserIds.includes(userId)
        );

        if (usersToBlacklist.length > 0) {
            Promise.all(
                usersToBlacklist.map(userId => blacklist(userId))
            ).then(results => {
                const newBlacklistedUsers = results.filter(result => result.action === "blacklist")
                    .map(result => bannedUsers.find(user => user.id === result.userId));

                const updatedBlacklistedUsers = [...blacklistedUsers, ...newBlacklistedUsers].filter(Boolean);
                updatedBlacklistedUsers.sort((a, b) => (a!.globalname || "").localeCompare(b!.globalname || ""));
                setBlacklistedUsers(updatedBlacklistedUsers as UserData[]);
                setBannedUsers(prev => prev.filter(user => !usersToBlacklist.includes(user.id)));
            });
        }

        if (usersAlreadyBlacklisted.length > 0) {
            Promise.all(
                usersAlreadyBlacklisted.map(userId => blacklist(userId))
            ).then(() => {
                const updatedBlacklistedUsers = blacklistedUsers.filter(user => !usersAlreadyBlacklisted.includes(user.id));

                updatedBlacklistedUsers.sort((a, b) => (a!.globalname || "").localeCompare(b!.globalname || ""));
                setBlacklistedUsers(updatedBlacklistedUsers);

                const unblacklistedUsers = usersAlreadyBlacklisted.filter(userId =>
                    !bannedUserIds.includes(userId)
                ).map(userId => blacklistedUsers.find(user => user.id === userId));

                const updatedBannedUsers = [...bannedUsers, ...unblacklistedUsers].filter(Boolean);
                updatedBannedUsers.sort((a, b) => (a!.globalname || "").localeCompare(b!.globalname || ""));
                setBannedUsers(updatedBannedUsers as UserData[]);
            });
        }
        setSelectedUsers(new Set());
    };


    const handleReason = () => {
        const selectedIds = Array.from(selectedUsers).join(" ");
        openBlacklistReasonModal(selectedIds);
        setSelectedUsers(new Set());
    };

    const selectedUserIds = Array.from(selectedUsers);
    const isAnySelectedUserBanned = selectedUserIds.some(userId => bannedUsers.some(bannedUser => bannedUser.id === userId));

    const filteredBannedUsers = bannedUsers.filter(bannedUser =>
        !blacklistedUsers.some(blacklistedUser => blacklistedUser.id === bannedUser.id)
    );

    const getBlacklistButtonText = () => {
        const selectedIds = Array.from(selectedUsers);
        const hasBlacklisted = selectedIds.some(userId => blacklistedUsers.some(user => user.id === userId));
        const hasNonBlacklisted = selectedIds.some(userId => bannedUsers.some(user => user.id === userId) && !blacklistedUsers.some(user => user.id === userId));

        if (hasBlacklisted && hasNonBlacklisted) {
            return "Blacklist & Unblacklist";
        } else if (hasNonBlacklisted) {
            return "Blacklist";
        } else if (hasBlacklisted) {
            return "Unblacklist";
        }
        return "Blacklist";
    };

    return (
        <ModalRoot {...props} size={ModalSize.LARGE} className="modal-root">
            <ModalHeader>
                <Text variant="heading-lg/semibold" className="modal-header-text">Blacklisted Users</Text>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent>
                <div className="modal-main-container">
                    {blacklistedUsers?.length > 0 ? (
                        blacklistedUsers.map(user => (
                            <div key={user.id} onClick={() => handleUserSelect(user.id)} className={`user-card ${selectedUsers.has(user.id) ? "selected" : ""}`}>
                                <div className="user-info">
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.has(user.id)}
                                        onChange={() => handleUserSelect(user.id)}
                                        className="user-checkbox"
                                    />
                                    <img className="user-avatar" width="46px" height="46px" src={user.avatar} alt="" />
                                    <div className="user-details">
                                        <span className="user-globalname">{user.globalname}</span>
                                        <span className="user-username">{user.username}</span>
                                        <span className="user-id">{user.id}</span>
                                    </div>
                                </div>
                                <p className="user-reason">{localStorage.getItem(`dbd-lfg-blacklist-reason-${user.id}`) || "No reason provided."}</p>
                                <p className="user-status">{localStorage.getItem("dbd-lfg-autoban-users")?.split(" ").includes(user.id) ? "Auto-Banned" : localStorage.getItem("dbd-lfg-banned-users")?.split(" ").includes(user.id) ? "Banned" : null}</p>
                            </div>
                        ))
                    ) : (
                        <Text>No users are blacklisted.</Text>
                    )}
                    {filteredBannedUsers.length > 0 && <span className="banned-section">Not Blacklisted</span>}
                    {filteredBannedUsers?.length > 0 ? (
                        filteredBannedUsers.map(user => (
                            <div key={user.id} onClick={() => handleUserSelect(user.id)} className={`user-card ${selectedUsers.has(user.id) ? "selected" : ""}`}>
                                <input
                                    type="checkbox"
                                    checked={selectedUsers.has(user.id)}
                                    onChange={() => handleUserSelect(user.id)}
                                    className="user-checkbox"
                                />
                                <div className="user-info">
                                    <img className="user-avatar" width="46px" height="46px" src={user.avatar} alt="" />
                                    <div className="user-details">
                                        <span className="user-globalname">{user.globalname}</span>
                                        <span className="user-username">{user.username}</span>
                                        <span className="user-id">{user.id}</span>
                                    </div>
                                </div>
                                <p className="user-reason"></p>
                                <p className="user-status">Banned</p>
                            </div>
                        ))
                    ) : null}
                </div>
            </ModalContent>
            <ModalFooter>
                <div className="modal-footer">
                    <Button
                        color={Button.Colors.RED}
                        className="ban-button"
                        onClick={handleBanSelected}
                        disabled={selectedUsers.size === 0 || isAnySelectedUserBanned}
                    >
                        Ban
                    </Button>
                    <Button
                        color={Button.Colors.RED}
                        className="ban-button"
                        onClick={handleAutoBanSelected}
                        disabled={selectedUsers.size === 0 || isAnySelectedUserBanned}
                    >
                        {Array.from(selectedUsers).some(userId => localStorage.getItem("dbd-lfg-autoban-users")?.split(" ").includes(userId))
                            ? "Remove Auto-Ban"
                            : "Auto-Ban"
                        }
                    </Button>
                    <Button
                        color={Button.Colors.TRANSPARENT}
                        className="reason-button"
                        onClick={handleReason}
                        disabled={selectedUsers.size === 0 || isAnySelectedUserBanned}
                    >
                        Edit Reason
                    </Button>
                    <Button
                        color={Button.Colors.BRAND}
                        className="blacklist-button"
                        onClick={handleBlacklist}
                        disabled={selectedUserIds.length === 0}
                    >
                        {getBlacklistButtonText()}
                    </Button>
                    <Button
                        color={Button.Colors.BRAND}
                        className="select-all-button"
                        onClick={handleSelectAll}
                        disabled={blacklistedUsers.length === 0}
                    >
                        {blacklistedUsers.length === 0 ? "Select All" : (selectedUsers.size === blacklistedUsers.length ? "Deselect All" : "Select All")}
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot >
    );
}

export function openBlacklistModal() {
    openModal(props => <ModalComponent {...props} />);
}
