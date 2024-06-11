import { ReactElement, useRef } from "react";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { findUserApi } from "@/services/api/user";
import { useSocket } from "@/context/socketProvider";
import { useEffect, useState } from "react";
import { ContentType, MessageType, UserStatusEnum } from "@/types/index";
import { getChatKeyApi, getMessagesApi } from "@/services/api/chat";
import {
  createSymetricKey,
  decryptMessage,
  encryptMessage,
  encryptSymetricKeyWithPublicKey,
} from "@/lib/ecrypt_decrypt";
import { useGetUser } from "@/hooks/useGetUser";
import { useAudioRecorder } from "react-audio-voice-recorder";
import { useToast } from "@/components/ui/use-toast";
import msgRecieveSound from "../../assets/Pocket.mp3";
import msgSendSound from "../../assets/Solo.mp3";
import { getValueFromStoreIDB } from "@/lib/idb";
import ChatContent from "@/components/chat/chatContent";
import ChatFooter from "@/components/chat/chatFooter";
import ChatHeader from "@/components/chat/chatHeader";
import Loader from "@/components/loader";

export default function PrivateChat(): ReactElement {
  const { id } = useParams();
  const socket = useSocket();
  const { user } = useGetUser();
  const [userStatus, setUserStatus] = useState<UserStatusEnum>(
    UserStatusEnum.OFFLINE
  );
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);
  const {
    isRecording,
    startRecording,
    stopRecording,
    recordingBlob,
    recordingTime,
  } = useAudioRecorder();
  const encryptedChatKeyRef = useRef<ArrayBuffer | undefined>(undefined);
  const { toast } = useToast();
  const sendMessageLoadingRef = useRef<boolean>(false);

  const { data: recipient, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const { isLoading: chatKeyLoading } = useQuery({
    queryKey: ["chatKeyquery", recipient?.chatId],
    enabled: !!recipient?.chatId,
    queryFn: () => getChatKeyApi(recipient?.chatId!),
    onSuccess: (data) => {
      if (data) encryptedChatKeyRef.current = data?.encryptedKey;
    },
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesquery", recipient?.chatId],
    queryFn: () => getMessagesApi(recipient.chatId!),
    enabled: !!recipient?.chatId && !!encryptedChatKeyRef.current,
    onSuccess: async (data: MessageType[]) => {
      if (!data || !user) return;

      const privateKey: CryptoKey = await getValueFromStoreIDB(user.userId);

      if (!privateKey) return;

      const decryptedData = await Promise.all(
        data?.map(async (message) => {
          if (message.isDeleted) return message;

          switch (message.contentType) {
            case ContentType.TEXT:
              message.text = (await decryptMessage(
                message?.content!,
                encryptedChatKeyRef.current!,
                privateKey,
                ContentType.TEXT
              )) as string;
              break;
            case ContentType.AUDIO:
              message.audio = (await decryptMessage(
                message?.content!,
                encryptedChatKeyRef.current!,
                privateKey,
                ContentType.AUDIO
              )) as Blob;
              break;
            case ContentType.IMAGE:
              message.image = (await decryptMessage(
                message?.content!,
                encryptedChatKeyRef.current!,
                privateKey,
                ContentType.IMAGE
              )) as Blob;
              break;

              default:
                break;
          }

          return message;
        })
      );
      setMessages(decryptedData);
    },
  });

  const handleTyping = (value: string) => {
    if (!socket) return;
    setTypedText(value);
    if (value.length > 0) {
      socket.emit("isTyping", { toUserId: id });
    } else {
      socket.emit("isNotTyping", { toUserId: id });
    }
  };

  const handleSendMessage = async (type: ContentType, imgBlob?: Blob) => {
    if (!socket || !recipient || !user?.publicKey) return;

    const privateKey: CryptoKey = await getValueFromStoreIDB(user.userId);
    if (!privateKey) return;

    sendMessageLoadingRef.current = true;

    const isChatAlreadyExist = recipient?.chatId;

    let encryptedChatKeyForUsers: Array<{
      userId: string;
      encryptedKey: ArrayBuffer;
    }> = [];

    let ourOwnEncryptedChatKey: ArrayBuffer | undefined;

    if (!isChatAlreadyExist) {
      const chatKey = await createSymetricKey();

      const usersWithPublicKey = [
        { userId: user?.userId, publicKey: user?.publicKey },
        { userId: recipient?.userId, publicKey: recipient?.publicKey },
      ];

      await Promise.all(
        usersWithPublicKey.map(async (item) => {
          const encryptedKey = await encryptSymetricKeyWithPublicKey(
            chatKey,
            item.publicKey
          );

          encryptedChatKeyForUsers.push({
            userId: item.userId,
            encryptedKey,
          });
        })
      );

      ourOwnEncryptedChatKey = encryptedChatKeyForUsers.find(
        (item) => item.userId === user?.userId
      )?.encryptedKey!;

      encryptedChatKeyRef.current = ourOwnEncryptedChatKey;
    }

    const chatContent =
      type === "TEXT"
        ? typedText
        : type === "IMAGE"
        ? imgBlob!
        : type === "AUDIO"
        ? recordingBlob!
        : "";

    const chatKey = isChatAlreadyExist
      ? encryptedChatKeyRef.current
      : ourOwnEncryptedChatKey!;

    if (!chatKey) return;

    const encryptedMessage = await encryptMessage(
      chatContent,
      chatKey,
      privateKey
    );

    socket.emit("sendPrivateMessage", {
      recipientId: id,
      message: {
        content: encryptedMessage,
        contentType: type,
      },
      encryptedChatKey: !isChatAlreadyExist && encryptedChatKeyForUsers,
    });

    setTypedText("");
    socket.emit("isNotTyping", { toUserId: id });
  };

  useEffect(() => {
    if (
      !socket ||
      !id ||
      !user ||
      (messages.length > 0 && !encryptedChatKeyRef.current)
    )
      return;

    const handleIsOnline = (
      status: UserStatusEnum.OFFLINE | UserStatusEnum.ONLINE
    ) => {
      setUserStatus(status);
    };

    const handleIsDisconnected = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.OFFLINE);
      }
    };

    const handleIsConnected = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.ONLINE);
      }
    };

    const handleIsTyping = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.TYPING);
      }
    };

    const handleIsNotTyping = (userId: string) => {
      if (userId === id) {
        setUserStatus(UserStatusEnum.ONLINE);
      }
    };

    const handleRecieveMessage = async ({
      message,
    }: {
      message: MessageType & {
        encryptedChatKeys?: Array<{
          userId: string;
          encryptedKey: ArrayBuffer;
        }>;
      };
    }) => {
      const privateKey = await getValueFromStoreIDB(user?.userId);
      if (!privateKey) return;

      if (message.encryptedChatKeys) {
        const encryptedKey = message.encryptedChatKeys.find(
          (item) => item.userId === user?.userId
        )?.encryptedKey;
        encryptedChatKeyRef.current = encryptedKey!;
      }

      switch (message.contentType) {
        case ContentType.TEXT:
          message.text = (await decryptMessage(
            message?.content!,
            encryptedChatKeyRef.current!,
            privateKey,
            ContentType.TEXT
          )) as string;
          break;
        case ContentType.AUDIO:
          message.audio = (await decryptMessage(
            message?.content!,
            encryptedChatKeyRef.current!,
            privateKey,
            ContentType.AUDIO
          )) as Blob;
          break;
        case ContentType.IMAGE:
          message.image = (await decryptMessage(
            message?.content!,
            encryptedChatKeyRef.current!,
            privateKey,
            ContentType.IMAGE
          )) as Blob;
          break;

          default:
            break;
      }

      setMessages((prev) => [...prev, message]);

      if (message.senderId === user?.userId) {
        sendMessageLoadingRef.current = false;
      }

      if (message.senderId === user?.userId) {
        await new Audio(msgSendSound).play();
      } else if (message.senderId !== user?.userId) {
        await new Audio(msgRecieveSound).play();
      }
    };

    const handleDeleteMessage = (messageId: string) => {
      setMessages((prev) =>
        prev.map((item) =>
          item.messageId === messageId ? { ...item, isDeleted: true } : item
        )
      );
    };

    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    socket.on("isTyping", handleIsTyping);

    socket.on("isNotTyping", handleIsNotTyping);

    socket.on("sendPrivateMessage", handleRecieveMessage);

    socket.on("deleteMessage", handleDeleteMessage);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
      socket.off("isTyping", handleIsTyping);
      socket.off("isNotTyping", handleIsNotTyping);
      socket.off("sendPrivateMessage", handleRecieveMessage);
      socket.off("deleteMessage", handleDeleteMessage);
    };
  }, [id, socket, encryptedChatKeyRef.current]);

  useEffect(() => {
    if (!recordingBlob) return;
    const sendAudioMessage = async () => {
      try {
        await handleSendMessage(ContentType.AUDIO);
      } catch (error) {
        console.log(error);
        toast({
          title: "Error sending audio message",
          variant: "destructive",
        });
      }
    };

    sendAudioMessage();
  }, [recordingBlob]);

  const handleDeleteMsg = (msgId: string) => {
    if (!socket) return;
    socket.emit("deleteMessage", { messageId: msgId, recipientId: id });
  };

  return (
    <>
      <main className="flex flex-col h-full">
        {isLoading ||
        !socket ||
        (recipient?.chatId && messagesLoading) ||
        chatKeyLoading ||
        !recipient ? (
          <Loader />
        ) : (
          <>
            <ChatHeader
              recipient={recipient}
              userStatus={userStatus}
              isGroup={false}
            />

            <ChatContent
              messages={messages}
              handleDeleteMsg={handleDeleteMsg}
              sendMessageLoadingRef={sendMessageLoadingRef}
            />

            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
              isRecording={isRecording}
              startRecoring={startRecording}
              stopRecording={stopRecording}
              recordingTime={recordingTime}
            />
          </>
        )}
      </main>
    </>
  );
}
