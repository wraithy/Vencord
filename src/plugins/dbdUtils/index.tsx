/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { NavContextMenuPatchCallback } from "@api/ContextMenu";
import { LogIcon, NotesIcon, SafetyIcon } from "@components/Icons";
import { Devs } from "@utils/constants";
import definePlugin from "@utils/types";
import { Menu } from "@webpack/common";

import { openBlacklistModal } from "./BlacklistModal";
import { openBlacklistReasonModal } from "./BlacklistReasonModal";
import { banUser, blacklist, getUserId, inChannel } from "./functions";
import { ChannelContextProps, UserContextProps } from "./interfaces";
import { Settings, VoiceStateStore } from "./util";

const UserContext: NavContextMenuPatchCallback = (children, { user, guildId }: UserContextProps) => {
    if (!user || user.id === getUserId() || guildId !== "153566829380370432") return;

    const isBlacklisted = Settings.store.blacklist && Settings.store.blacklist.split(" ").includes(user.id);
    const label = isBlacklisted ? "Unblacklist" : "Blacklist";

    children.splice(-1, 0, (
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="ban-user"
                label="Ban"
                action={() => banUser(user.id, guildId!)}
                icon={SafetyIcon}
                className="ac-danger-button"
            />
            <Menu.MenuItem
                id="blacklist-user"
                label={label}
                action={() => openBlacklistReasonModal(user.id)}
                icon={NotesIcon}
                className="ac-danger-button"
            />
        </Menu.MenuGroup>
    ));
};

const ChannelContext: NavContextMenuPatchCallback = (children: React.ReactNode[], { channel }: ChannelContextProps) => {
    if (channel.guild_id !== "153566829380370432" || channel.type !== 2) return;

    const users = VoiceStateStore.getVoiceStatesForChannel(channel.id);
    const self = users[getUserId()];

    const isAnyUserBlacklisted = Object.keys(users).some(userId =>
        Settings.store.blacklist && Settings.store.blacklist.split(" ").includes(userId)
    );

    const menuItems: React.ReactNode[] = [];

    if (self) {
        menuItems.push(
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id="vc-ban-blacklisted"
                    label="Ban Blacklist"
                    action={() => banUser(Settings.store.blacklist!, channel.guild_id!)}
                    icon={SafetyIcon}
                    className="ac-danger-button"
                />
            </Menu.MenuGroup>
        );
    } else {
        menuItems.push(
            <Menu.MenuGroup>
                <Menu.MenuItem
                    id="vc-ban-all"
                    label="Ban Users"
                    action={() => banUser(Object.keys(users).join(" "), channel.guild_id!)}
                    icon={SafetyIcon}
                    className="ac-danger-button"
                />
                <Menu.MenuItem
                    id="vc-blacklisted-all"
                    label={isAnyUserBlacklisted ? "Unblacklist Users" : "Blacklist Users"}
                    action={() => {
                        if (isAnyUserBlacklisted) {
                            Object.keys(users).forEach(id => {
                                if (Settings.store.blacklist && Settings.store.blacklist.split(" ").includes(id)) {
                                    blacklist(id);
                                }
                            });
                        } else {
                            openBlacklistReasonModal(Object.keys(users).join(" "));
                        }
                    }}
                    icon={NotesIcon}
                    className="ac-danger-button"
                />
            </Menu.MenuGroup>
        );
    }

    menuItems.push(
        <Menu.MenuGroup>
            <Menu.MenuItem
                id="vc-view-blacklist"
                label="View Blacklist"
                action={() => openBlacklistModal()}
                icon={LogIcon}
                className="ac-button"
            />
        </Menu.MenuGroup>
    );

    children.splice(-1, 0, ...menuItems);
};

export default definePlugin({
    name: "DBD LFG Utils",
    authors: [Devs.Wraith],
    description: "Various utilities for the DBD LFG Discord server.",
    settings: Settings,
    tags: ["Moderation", "User Management"],
    dependencies: [],
    contextMenus: {
        "user-context": UserContext,
        "channel-context": ChannelContext
    },

    patches: [
        {
            find: "renderChannelButtons(){let{channel",
            replacement: {
                match: /(let c=[^;]*;)/,
                replace: "$1$self.exec(this.props.channel);"
            }
        }
    ],

    exec(c) {
        inChannel(c);
    },
});
