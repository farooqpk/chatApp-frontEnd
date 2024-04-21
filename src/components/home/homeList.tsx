import { ReactElement } from "react";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { formateDate } from "@/lib/format-date";
import { truncateMessage } from "@/lib/trunctuate";
import { useGetUser } from "@/hooks/user";
import { MessageType } from "../common/types";

export const HomeList = ({
  data,
  latestMessage,
  isTyping,
}: {
  data: any;
  latestMessage: MessageType | null;
  isTyping: string[];
}): ReactElement => {
  const { user } = useGetUser();

  return (
    <>
      {data?.map((chats: any, index: number) => (
        <div className="md:w-[60%] mx-auto" key={index}>
          {chats?.isGroup ? (
            <Link
              to={`/group/${chats?.Group[0]?.groupId}`}
              className="flex justify-between items-center p-3 hover:bg-slate-950 rounded-2xl "
            >
              <Avatar>
                <AvatarFallback className="capitalize">
                  {chats?.Group[0]?.name[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-sm md:text-xl font-semibold">
                  {chats?.Group[0]?.name}
                </h2>
                {isTyping.includes(chats?.participants[0]?.user?.userId) ? (
                  <span className="text-xs md:text-sm text-warning">
                    Typing...
                  </span>
                ) : (
                  <span className="text-secondary text-xs md:text-lg">
                    {truncateMessage(chats?.Group[0]?.description)}
                  </span>
                )}
              </div>

              <span className="text-secondary text-xs md:text-lg">
                {formateDate(chats?.messages[0]?.createdAt || chats?.createdAt)}
              </span>
            </Link>
          ) : (
            <Link
              to={`/chat/${chats?.participants[0]?.user?.userId}`}
              className="flex justify-between items-center p-3 hover:bg-slate-950 rounded-2xl "
            >
              <Avatar>
                <AvatarFallback className="capitalize">
                  {chats?.participants[0]?.user?.username[0]}
                </AvatarFallback>
              </Avatar>

              <div className="flex flex-col items-center gap-2">
                <h2 className="text-sm md:text-xl font-semibold ">
                  {chats?.participants[0]?.user?.username}
                </h2>
                {isTyping.includes(chats?.participants[0]?.user?.userId) ? (
                  <span className="text-xs md:text-sm text-warning">
                    Typing...
                  </span>
                ) : (
                  <span className="text-secondary text-xs md:text-lg">
                    {truncateMessage(
                      latestMessage && latestMessage?.chatId === chats?.chatId
                        ? user?.userId === latestMessage?.senderId
                          ? latestMessage?.contentForSender
                          : latestMessage?.contentForRecipient
                        : user?.userId === chats?.messages[0]?.senderId
                        ? chats?.messages[0]?.contentForSender
                        : chats?.messages[0]?.contentForRecipient
                    )}
                  </span>
                )}
              </div>

              <span className="text-secondary text-xs md:text-lg">
                {formateDate(chats?.messages[0]?.createdAt)}
              </span>
            </Link>
          )}
        </div>
      ))}
    </>
  );
};
