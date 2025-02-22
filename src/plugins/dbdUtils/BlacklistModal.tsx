/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

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
import { Button, Text, useEffect, UserStore, useState } from "@webpack/common";

import { banUser, blacklist } from "./functions";
import { UserData } from "./interfaces";
import { Settings } from "./util";

function ModalComponent(props) {

    const [users, setUsers] = useState<UserData[]>([]);
    const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchedUsers = Settings.store.blacklist
            ?.split(" ")
            .map(id => {
                const user = UserStore.getUser(id);
                return user ? {
                    id: id,
                    username: user.username,
                    avatar: user.getAvatarURL()
                } : null;
            })
            .filter(user => user !== null) || [];

        fetchedUsers.sort((a, b) => a.username.localeCompare(b.username));

        setUsers(fetchedUsers as UserData[]);
    }, []);

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
        if (selectedUsers.size === users.length) {
            setSelectedUsers(new Set());
        } else {
            const newSelectedUsers = new Set(users.map(user => user.id));
            setSelectedUsers(newSelectedUsers);
        }
    };

    const handleBanSelected = () => {
        const selectedIds = Array.from(selectedUsers).join(" ");
        if (selectedIds) {
            banUser(selectedIds, "153566829380370432");
            setSelectedUsers(new Set());
        }
    };

    const handleAutoBanSelected = () => {
        const selectedIds = Array.from(selectedUsers);
        if (selectedIds.length > 0) {
            const bannedUsers = localStorage.getItem("dbd-lfg-autoban-users") || "";
            const bannedUsersArray = bannedUsers.split(" ").filter(Boolean);
            const isAnyBanned = selectedIds.some(id => bannedUsersArray.includes(id));

            if (isAnyBanned) {
                const updatedBannedUsers = bannedUsersArray.filter(id => !selectedIds.includes(id));
                localStorage.setItem("dbd-lfg-autoban-users", updatedBannedUsers.join(" "));
            } else {
                const updatedBannedUsers = [...bannedUsersArray, ...selectedIds];
                localStorage.setItem("dbd-lfg-autoban-users", updatedBannedUsers.join(" "));
            }

            setSelectedUsers(new Set());
        }
    };

    const handleUnblacklistSelected = () => {
        const selectedIds = Array.from(selectedUsers);
        Promise.all(
            selectedIds.map(userId => blacklist(userId))
        ).then(() => {
            setUsers(users.filter(u => !selectedIds.includes(u.id)));
        });
        setSelectedUsers(new Set());
    };

    return (
        <ModalRoot {...props} size={ModalSize.MEDIUM} className="modal-root">
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1, display: "flex" }}>Blacklisted Users</Text>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent>
                <div className="modal-main-container" style={{ display: "flex", flexDirection: "column", gap: "0.4em", width: "100%", paddingTop: "1em", paddingBottom: "1em" }}>
                    {users?.length > 0 ? (
                        users.map(user => (
                            <div key={user.id} onClick={() => handleUserSelect(user.id)} style={{ display: "grid", gridTemplateColumns: "5fr 4fr 2fr", gap: "2em", padding: "1em", cursor: "pointer", backgroundColor: "var(--background-secondary)", borderRadius: "4px", ...(selectedUsers.has(user.id) ? { border: "1px solid var(--green-430)" } : { border: "1px solid transparent" }) }}>
                                <div style={{ display: "flex", flexDirection: "row" }}>
                                    <input
                                        type="checkbox"
                                        checked={selectedUsers.has(user.id)}
                                        onChange={() => handleUserSelect(user.id)}
                                        style={{ display: "none" }}
                                    />
                                    <img style={{ marginRight: "0.6em", verticalAlign: "middle", borderRadius: "50%" }} width="42px" height="42px" src={user.avatar} alt="" />
                                    <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", gap: "0.2em" }}>
                                        <span style={{ color: "var(--text-normal)", fontSize: "1rem" }}>{user.username}</span>
                                        <span style={{ color: "var(--text-muted)", fontSize: "0.75rem" }}>{user.id}</span>
                                    </div>
                                </div>
                                <p style={{ overflow: "ellipsis", width: "100%", color: "var(--text-muted)", fontSize: "0.75rem" }}>{localStorage.getItem(`dbd-lfg-blacklist-reason-${user.id}`) || "No reason provided."}</p>
                                <p style={{ marginLeft: "auto", marginRight: "1em", color: "var(--red-460)", fontSize: "0.75rem" }}>{localStorage.getItem("dbd-lfg-autoban-users")?.split(" ").includes(user.id) ? "Auto-Banned" : localStorage.getItem("dbd-lfg-banned-users")?.split(" ").includes(user.id) ? "Banned" : null}</p>
                            </div>
                        ))
                    ) : (
                        <Text>No users are blacklisted.</Text>
                    )}
                </div>
            </ModalContent >
            <ModalFooter>
                <div style={{ display: "flex", gap: "1em" }}>
                    <Button color={Button.Colors.RED} className="ban-button" onClick={handleBanSelected} disabled={selectedUsers.size === 0}>Ban</Button>
                    <Button color={Button.Colors.RED} className="ban-button" onClick={handleAutoBanSelected} disabled={selectedUsers.size === 0}>
                        {
                            Array.from(selectedUsers).some(userId => localStorage.getItem("dbd-lfg-autoban-users")?.split(" ").includes(userId))
                                ? "Remove Auto-Ban"
                                : "Auto-Ban"
                        }
                    </Button>
                    <Button color={Button.Colors.BRAND} className="blacklist-button" onClick={handleUnblacklistSelected} disabled={selectedUsers.size === 0}>Unblacklist</Button>
                    <Button
                        color={Button.Colors.BRAND}
                        className="select-all-button"
                        onClick={handleSelectAll}
                        disabled={users.length === 0}
                    >
                        {users.length === 0 ? "Select All" : (selectedUsers.size === users.length ? "Deselect All" : "Select All")}
                    </Button>
                </div>
            </ModalFooter>
        </ModalRoot >
    );
}

export function openBlacklistModal() {
    openModal(props => <ModalComponent {...props} />);
}
