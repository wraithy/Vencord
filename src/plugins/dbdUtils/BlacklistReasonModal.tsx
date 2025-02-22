/*
 * Vencord, a Discord client mod
 * Copyright (c) 2025 Vendicated and contributors
 * SPDX-License-Identifier: GPL-3.0-or-later
 */

import { ModalCloseButton, ModalContent, ModalFooter, ModalHeader, ModalRoot, ModalSize, openModal } from "@utils/modal";
import { Button, Text, TextInput, useState } from "@webpack/common";

import { blacklist } from "./functions";

function ModalComponent(props) {
    const [reason, setReason] = useState("");

    const handleConfirm = () => {
        const { userId, onClose } = props;
        const userIds = userId.split(" ");
        userIds.forEach(id => blacklist(id, reason));
        onClose();
    };

    return (
        <ModalRoot {...props} size={ModalSize.SMALL}>
            <ModalHeader>
                <Text variant="heading-lg/semibold" style={{ flexGrow: 1 }}>Blacklist Reason</Text>
                <ModalCloseButton onClick={props.onClose} />
            </ModalHeader>
            <ModalContent>
                <div className="modal-main-container" style={{ display: "flex", flexDirection: "column", gap: "0.4em", width: "100%", paddingTop: "1em", paddingBottom: "1em" }}>
                    <TextInput
                        placeholder="Enter a reason"
                        value={reason}
                        onChange={e => setReason(e)}
                        style={{ marginTop: "10px" }}
                    />
                </div>
            </ModalContent>
            <ModalFooter>
                <div style={{ display: "flex", gap: "1em" }}>
                    <Button color={Button.Colors.TRANSPARENT} onClick={props.onClose}>Cancel</Button>
                    <Button color={Button.Colors.RED} onClick={handleConfirm}>Confirm</Button>
                </div>
            </ModalFooter>
        </ModalRoot>
    );
}

export function openBlacklistReasonModal(userId: string) {
    openModal(props => <ModalComponent {...props} userId={userId} />);
}
