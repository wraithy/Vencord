/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { localStorage } from "@utils/localStorage";
import { Constants, RestAPI, SnowflakeUtils, UserStore } from "@webpack/common";

import { SessionsStore, Settings, VoiceStateStore } from "./util";

let inAChannel = false;
let lastExecTime = 0;
const dur = 10 * 1000;

const getUserId = () => {
    const id = UserStore.getCurrentUser()?.id;
    if (!id) throw new Error("User not yet logged in");
    return id;
};

const checkExecution = () => {
    const currentTime = Date.now();

    if (currentTime - lastExecTime > dur) {
        clearLocalStorage();
        inAChannel = false;
    }
};

const inChannel = (channel: any) => {
    if (channel.guild_id !== "153566829380370432") {
        clearLocalStorage();
    } else {
        if (!inAChannel) {
            if (/SWF[🟢🔵]/u.test(channel.name)) {
                inAChannel = true;
                autoBanUser(channel);
                setInterval(checkExecution, dur);
            }
        }
        lastExecTime = Date.now();
    }
};

const clearLocalStorage = () => {
    localStorage.removeItem("dbd-lfg-banned-users");
    if (localStorage.getItem("dbd-lfg-autoban-users") === "") {
        localStorage.removeItem("dbd-lfg-autoban-users");
    }
};

const autoBanUser = async (channel: any) => {
    const users = Object.keys(VoiceStateStore.getVoiceStatesForChannel(channel.id));
    if (users[0] === getUserId()) {
        const bannedUsers = localStorage.getItem("dbd-lfg-banned-users") || "";
        const autoBanUsers = localStorage.getItem("dbd-lfg-autoban-users");

        if (autoBanUsers && autoBanUsers.split(" ").length > 0) {
            banUser(autoBanUsers!, channel.guild_id);
            localStorage.setItem("dbd-lfg-banned-users", bannedUsers! ? `${bannedUsers!} ${autoBanUsers!}` : autoBanUsers!);
        }
    }
};

const blacklist = async (userId: string, reason?: string) => {
    const blacklistList = Settings.store.blacklist?.trim() || "";
    const isBlacklisted = blacklistList.split(" ").includes(userId);

    if (isBlacklisted) {
        Settings.store.blacklist = blacklistList
            .split(" ")
            .filter(id => id !== userId)
            .join(" ");

        localStorage.removeItem(`dbd-lfg-blacklist-reason-${userId}`);
        localStorage.setItem("dbd-lfg-autoban-users", localStorage.getItem("dbd-lfg-autoban-users")?.split(" ").filter(id => id !== userId).join(" ") || "");

        return { action: "unblacklist", userId };
    } else {
        Settings.store.blacklist = blacklistList
            ? `${blacklistList} ${userId}`
            : userId;

        if (reason) {
            localStorage.setItem(`dbd-lfg-blacklist-reason-${userId}`, reason);
        }

        return { action: "blacklist", userId };
    }
};

const banUser = async (userId: string, guildId: string) => {
    if (!guildId || !userId) {
        console.error("Guild ID and User ID are required for banning the user.");
        return;
    }

    const sessions = SessionsStore.getSessions();
    const sessionId = Object.values(sessions)[0]?.sessionId;

    const postData = {
        type: 2,
        application_id: "383777390851260426",
        guild_id: guildId,
        channel_id: "717391573955903499",
        session_id: sessionId,
        data: {
            version: "1016532766868897823",
            id: "986183862470213638",
            name: "autochannel",
            type: 1,
            options: [
                {
                    type: 1,
                    name: "ban",
                    options: [
                        {
                            type: 3,
                            name: "ban_targets",
                            value: userId,
                        },
                    ],
                },
            ],
        },
        nonce: SnowflakeUtils.fromTimestamp(Date.now()),
        analytics_location: "slash_ui",
    };

    RestAPI.post({
        url: Constants.Endpoints.INTERACTIONS,
        body: postData,
    }).then(response => {
        console.log("Ban interaction sent successfully!", response);

        const bannedUsers = localStorage.getItem("dbd-lfg-banned-users") || "";
        const bannedUsersArray = bannedUsers.trim().split(" ").filter(Boolean);
        const updatedBannedUsers = [...bannedUsersArray, userId].join(" ");

        localStorage.setItem("dbd-lfg-banned-users", updatedBannedUsers);
    }).catch(error => {
        console.error("Error sending ban interaction:", error);
    });
};

export { autoBanUser, banUser, blacklist, clearLocalStorage, getUserId, inAChannel, inChannel };
