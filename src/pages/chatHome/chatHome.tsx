import { ReactElement } from "react";
import { ChatContent } from "../../components/chatHome/chatContent";
import { ChatFooter } from "../../components/chatHome/chatFooter";
import { ChatHeader } from "../../components/chatHome/chatHeader";
import { useParams } from "react-router-dom";
import { useQuery } from "react-query";
import { findUserApi } from "@/services/api/user";
import Loader from "@/components/loader";
import { useSocket } from "@/socket/socketProvider";
import { useEffect, useState } from "react";
import { MessageType, UserStatusEnum } from "@/components/common/types";
import { getMessagesApi } from "@/services/api/chat";
import { decryptMessage, encryptMessage } from "@/lib/ecrypt_decrypt";
import { useGetUser } from "@/hooks/user";

export const ChatHome = (): ReactElement => {
  const { id } = useParams();
  const socket = useSocket();
  const { user } = useGetUser();

  const [userStatus, setUserStatus] = useState<UserStatusEnum>(
    UserStatusEnum.OFFLINE
  );
  const [typedText, setTypedText] = useState<string>("");
  const [messages, setMessages] = useState<MessageType[]>([]);

  const { data: recipient, isLoading } = useQuery({
    queryKey: ["userquery", id],
    queryFn: () => findUserApi(id!),
  });

  const { isLoading: messagesLoading } = useQuery({
    queryKey: ["messagesquery", id],
    queryFn: () => getMessagesApi(recipient.chatId!),
    enabled: !!recipient?.chatId,
    onSuccess: async (data) => {
      const decryptedData = await Promise.all(
        data.map(async (message: MessageType) => {
          if (user?.userId === message.senderId) {
            message.contentForSender = await decryptMessage(
              message.contentForSender,
              message.encryptedSymetricKeyForSender,
              localStorage.getItem("privateKey")!
            );
          } else {
            message.contentForRecipient = await decryptMessage(
              message.contentForRecipient,
              message.encryptedSymetricKeyForRecipient,
              localStorage.getItem("privateKey")!
            );
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

  const handleSendMessage = async () => {
    if (!socket || !recipient) return;

    const {
      encryptedMessage: encryptedMessageForRecipient,
      encryptedSymetricKey: encryptedSymetricKeyForRecipient,
    } = await encryptMessage(
      typedText,
      localStorage.getItem("symetricKey")!,
      recipient.publicKey
    );
    const {
      encryptedMessage: encryptedMessageForSender,
      encryptedSymetricKey: encryptedSymetricKeyForSender,
    } = await encryptMessage(
      typedText,
      localStorage.getItem("symetricKey")!,
      localStorage.getItem("publicKey")!
    );

    socket.emit("sendMessage", {
      userId: id,
      message: {
        encryptedMessageForRecipient,
        encryptedSymetricKeyForRecipient,
        encryptedMessageForSender,
        encryptedSymetricKeyForSender,
      },
    });
    setTypedText("");
    socket.emit("isNotTyping", { toUserId: id });
  };

  useEffect(() => {
    if (!socket) return;

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

    const handleRecieveMessage = async (data: MessageType) => {
      if (user?.userId === data.senderId) {
        data.contentForSender = await decryptMessage(
          data.contentForSender,
          data.encryptedSymetricKeyForSender,
          localStorage.getItem("privateKey")!
        );
      } else {
        data.contentForRecipient = await decryptMessage(
          data.contentForRecipient,
          data.encryptedSymetricKeyForRecipient,
          localStorage.getItem("privateKey")!
        );
      }

      setMessages((prev) => [...prev, data]);
    };

    socket.emit("isOnline", id);

    socket.on("isOnline", handleIsOnline);

    socket.on("isDisconnected", handleIsDisconnected);

    socket.on("isConnected", handleIsConnected);

    socket.on("isTyping", handleIsTyping);

    socket.on("isNotTyping", handleIsNotTyping);

    socket.on("sendMessage", handleRecieveMessage);

    return () => {
      socket.off("isOnline", handleIsOnline);
      socket.off("isDisconnected", handleIsDisconnected);
      socket.off("isConnected", handleIsConnected);
      socket.off("isTyping", handleIsTyping);
      socket.off("isNotTyping", handleIsNotTyping);
      socket.off("sendMessage", handleRecieveMessage);
    };
  }, [id, socket]);

  return (
    <>
      <main className="h-screen flex flex-col relative">
        {isLoading || !socket || (recipient?.chatId && messagesLoading) ? (
          <Loader />
        ) : (
          <>
            <ChatHeader recipient={recipient} userStatus={userStatus} />

            <ChatContent recipient={recipient} messages={messages} />

            <ChatFooter
              handleTyping={handleTyping}
              handleSendMessage={handleSendMessage}
              typedText={typedText}
            />
          </>
        )}
      </main>
    </>
  );
};
