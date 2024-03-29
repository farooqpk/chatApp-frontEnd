import _axios from "@/lib/_axios";

export const getMessagesApi = async (chatId: string) => {
  return (await _axios.get(`/messages/${chatId}`)).data;
};

export const getChatListApi = async () => {
  return (await _axios.get(`/chat-list`)).data;
};
