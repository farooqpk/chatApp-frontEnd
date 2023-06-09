import axios from "axios";
import { useQuery } from "react-query";

export const useRandomUsersForSearchbar = () => {
    
  return useQuery(
    "getRandomUsersForSearch",
    async () => {
      try {
        return await axios.get(
          `${import.meta.env.VITE_SERVER_URL}/getRandomUsersForSearch`,{
            withCredentials:true
          }
        );
      } catch (error: any) {
        if (error.response) {
          throw new Error(error.response.data.message);
        } else {
          throw new Error(
            "Check your internet connection,or please try again later"
          );
        }
      }
    },
    {
      retry: false,
      staleTime: Infinity,
    }
  );
};
