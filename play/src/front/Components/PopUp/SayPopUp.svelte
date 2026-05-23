<script lang="ts">
    import { SayMessageType } from "@workadventure/messages";
    import { createEventDispatcher, onDestroy, onMount } from "svelte";
    import { gameManager } from "../../Phaser/Game/GameManager";
    import { inputFormFocusStore } from "../../Stores/UserInputStore";
    import { popupJustClosed } from "../../Phaser/Game/Say/SayManager";
    import Select from "../Input/Select.svelte";
    import LL from "../../../i18n/i18n-svelte";
    import Input from "../Input/Input.svelte";
    import ButtonClose from "../Input/ButtonClose.svelte";
    import PopUpContainer from "./PopUpContainer.svelte";
    import { IconSend } from "@wa-icons";

    export let type: "say" | "think" = "say";
    export let persist = false;
    let message = "";
    let messageInput: Input;

    const dispatch = createEventDispatcher<{ close: void }>();

    function closeBanner() {
        if (persist) return;
        dispatch("close");
    }

    onMount(() => {
        if (!persist) messageInput.focusInput();
    });

    onDestroy(() => {
        inputFormFocusStore.set(false);
        popupJustClosed();
    });

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") closeBanner();
    };

    function sendMessageOrEscapeLine(keyDownEvent: KeyboardEvent | MouseEvent) {
        if (keyDownEvent instanceof MouseEvent) {
            sendMessage(message.replace(/<br>/g, "\n"));
            return;
        }
        if (keyDownEvent.key === "Enter" && keyDownEvent.shiftKey) return;
        if (keyDownEvent.key === "Enter" && !keyDownEvent.shiftKey) keyDownEvent.preventDefault();
        if (keyDownEvent.key === "Enter" && message.trim().length !== 0) {
            sendMessage(message.replace(/<br>/g, "\n"));
        }
    }

    function sendMessage(msg: string) {
        const gameScene = gameManager.getCurrentGameScene();
        gameScene.sayManager.say(
            msg,
            type === "say" ? SayMessageType.SpeechBubble : SayMessageType.ThinkingCloud,
            type === "say" ? 5000 : undefined
        );
        message = "";
        if (!persist) closeBanner();
    }
</script>

<svelte:window on:keydown={onKeyDown} />

{#if persist}
    <div class="ms-bar" data-testid="say-popup">
        <button class="ms-btn ms-channel">ALL</button>
        <input
            class="ms-input"
            type="text"
            bind:value={message}
            placeholder="Type here and press Enter to chat..."
            on:keydown={sendMessageOrEscapeLine}
            on:focusin={() => inputFormFocusStore.set(true)}
            on:focusout={() => inputFormFocusStore.set(false)}
            maxlength={100}
        />
        <button class="ms-btn ms-send" on:click={sendMessageOrEscapeLine}>▶</button>
    </div>
{:else}
    <PopUpContainer reduceOnSmallScreen={true} fullContent={true}>
        <div class="flex flex-row w-full items-center gap-2 min-w-80" data-testid="say-popup">
            <ButtonClose
                on:click={closeBanner}
                bgColor="bg-constrast"
                hoverColor="bg-white/20"
                size="md"
                dataTestId="btn-close-say-popup"
            />
            <div class="flex-none w-24">
                <Select
                    bind:value={type}
                    options={[
                        { value: "say", label: $LL.say.type.say() },
                        { value: "think", label: $LL.say.type.think() },
                    ]}
                    extraSelectClass="!mb-0"
                />
            </div>
            <div class="flex flex-row gap-2">
                <Input
                    onKeyDown={sendMessageOrEscapeLine}
                    bind:value={message}
                    bind:this={messageInput}
                    placeholder={$LL.say.placeholder()}
                    extraInputClasses="!mb-0"
                    maxlength={100}
                />
                <button
                    class="h-10 {message.length > 0
                        ? 'w-10'
                        : 'w-0'} p-0 aspect-square bg-secondary rounded flex items-center justify-center cursor-pointer transition-all"
                    on:click={sendMessageOrEscapeLine}
                >
                    <IconSend />
                </button>
            </div>
        </div>
    </PopUpContainer>
{/if}

<style>
    .ms-bar {
        display: flex;
        align-items: center;
        background: #c0c0c0;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #808080;
        border-bottom: 2px solid #808080;
        box-shadow: inset -1px -1px 0 #404040, inset 1px 1px 0 #dfdfdf;
        padding: 5px 7px;
        gap: 6px;
        width: 100%;
        pointer-events: auto;
        font-family: "Tahoma", "MS Sans Serif", Arial, sans-serif;
    }

    .ms-btn {
        background: #c0c0c0;
        border-top: 2px solid #ffffff;
        border-left: 2px solid #ffffff;
        border-right: 2px solid #404040;
        border-bottom: 2px solid #404040;
        box-shadow: inset -1px -1px 0 #000000, inset 1px 1px 0 #dfdfdf;
        color: #000000;
        font-family: "Tahoma", "MS Sans Serif", Arial, sans-serif;
        font-size: 15px;
        font-weight: bold;
        padding: 3px 10px;
        height: 34px;
        cursor: pointer;
        white-space: nowrap;
        flex-shrink: 0;
    }

    .ms-btn:active {
        border-top: 2px solid #404040;
        border-left: 2px solid #404040;
        border-right: 2px solid #ffffff;
        border-bottom: 2px solid #ffffff;
        box-shadow: inset 1px 1px 0 #000000;
    }

    .ms-channel {
        min-width: 64px;
    }

    .ms-send {
        width: 34px;
        padding: 0;
    }

    .ms-input {
        flex: 1;
        background: #ffffff;
        border-top: 2px solid #808080;
        border-left: 2px solid #808080;
        border-right: 2px solid #dfdfdf;
        border-bottom: 2px solid #dfdfdf;
        box-shadow: inset 1px 1px 0 #404040;
        color: #000000;
        font-family: "Tahoma", "MS Sans Serif", Arial, sans-serif;
        font-size: 16px;
        padding: 3px 8px;
        outline: none;
        height: 34px;
    }

    .ms-input::placeholder {
        color: #808080;
        font-style: italic;
    }

    .ms-input:focus {
        outline: none;
    }
</style>
