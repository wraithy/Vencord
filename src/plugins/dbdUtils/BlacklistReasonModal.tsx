/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import "./styles.css";

import { localStorage } from "@utils/localStorage";
import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Button, Text, TextInput, useState } from "@webpack/common";

import { blacklist } from "./functions";
import { Settings } from "./util";

function ModalComponent(props) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        const { userId, onClose } = props;
        const userIds = userId.split(" ");
        userIds.forEach(id => {
            if (Settings.store.blacklist && Settings.store.blacklist.split(" ").includes(id)) {
                localStorage.setItem(`dbd-lfg-blacklist-reason-${id}`, reason);
            } else {
                blacklist(userId, reason);
            }
        });
        onClose();
    };

    return (
        <ModalRoot {...props} size={ModalSize.SMALL}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" className="modal-header-text">Blacklist Reason</Text>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent>
                <div className="modal-main-container">
                    <TextInput
                        placeholder="Enter a reason"
                        value={reason}
                        onChange={e => setReason(e)}
                        style={{ marginTop: "10px" }}
                    />
                </div>
            </ModalContent>
            <ModalFooter>
                <div className="modal-footer">
                    <Button color={Button.Colors.TRANSPARENT} onClick={props.onClose}>Cancel</Button>
                    <Button color={Button.Colors.RED} onClick={handleConfirm}>Confirm</Button>
                </div>
            </ModalFooter>
        </ModalRoot >
    );
}

export function openBlacklistReasonModal(userId: string) {
    openModal(props => <ModalComponent {...props} userId={userId} />);
}
