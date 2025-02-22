/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { definePluginSettings } from "@api/Settings";
import { OptionType } from "@utils/types";
import { findStoreLazy } from "@webpack";

import { Session } from "./interfaces";

const Settings = definePluginSettings({
    blacklist: {
        type: OptionType.STRING,
        description: "A list of users who will be banned from joining your AC channel with a single click of a button.",
    }
});

const SessionsStore = findStoreLazy("SessionsStore") as {
    getSessions(): Record<string, Session>;
};

const VoiceStateStore = findStoreLazy("VoiceStateStore");

export { SessionsStore, Settings, VoiceStateStore };
