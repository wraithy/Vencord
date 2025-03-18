/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { Channel, User } from "discord-types/general";

interface UserData {
    id: string;
    globalname: string;
    username: string;
    avatar: string;
    timestamp: number;
}

interface Session {
    sessionId: string;
    status: string;
    active: boolean;
    clientInfo: {
        version: number;
        os: string;
        client: string;
    };
}

interface UserContextProps {
    guildId?: string;
    user: User;
}

interface ChannelContextProps {
    channel: Channel;
}

export { ChannelContextProps, Session, UserContextProps, UserData };
