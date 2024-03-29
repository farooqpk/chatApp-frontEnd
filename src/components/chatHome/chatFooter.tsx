import { Textarea } from "@/components/ui/textarea";
import { Button } from "../ui/button";
import { SendHorizontal, Smile } from "lucide-react";
import { Theme } from "emoji-picker-react";
import EmojiPicker from "emoji-picker-react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { useRef } from "react";

type Props = {
  handleTyping: (value: string) => void;
  handleSendMessage: () => void;
  typedText: string;
};

export const ChatFooter = ({
  handleTyping,
  handleSendMessage,
  typedText,
}: Props) => {
  const chatInputRef = useRef<HTMLTextAreaElement>(null);

  const handleOnEmojiClick = (emojiData: any) => {
    if (chatInputRef.current) {
      const emoji = emojiData.emoji;
      chatInputRef.current.value += emoji;
      chatInputRef.current.focus();
      handleTyping(chatInputRef.current.value);
    }
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault(); // Prevents adding a new line
      typedText.length > 0 && handleSendMessage();
    }
  };

  return (
    <section className="flex gap-1 md:gap-4 items-center px-5 md:px-24 relative">
      <Dialog>
        <DialogTrigger>
          <Button variant="ghost" size="icon" className="rounded-full p-2">
            <Smile />
          </Button>
        </DialogTrigger>
        <DialogContent className="bg-transparent border-none">
          <EmojiPicker
            onEmojiClick={handleOnEmojiClick}
            theme={Theme.DARK}
            skinTonesDisabled
            width={"95%"}
            style={{ backgroundColor: "transparent" }}
            lazyLoadEmojis
            searchDisabled
          />
        </DialogContent>
      </Dialog>

      <Textarea
        placeholder="Type something..."
        className="resize-none"
        ref={chatInputRef}
        onChange={(e) => handleTyping(e.target.value)}
        value={typedText}
        onKeyDown={handleKeyDown}
      />

      <Button
        variant="ghost"
        size="icon"
        className="rounded-full p-2"
        onClick={handleSendMessage}
        disabled={typedText.length > 0 ? false : true}
      >
        <SendHorizontal />
      </Button>
    </section>
  );
};
