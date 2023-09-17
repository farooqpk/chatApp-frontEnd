import { useEffect, useState } from "react";
import { FaMicrophone, FaLocationArrow } from "react-icons/fa";
import { MdAddCircleOutline } from "react-icons/md";
import { useSocket } from "../../socket/socketProvider";
import { useLocation } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setMessage } from "../../redux/slices/chatMsgSlice";
import { RootStateTypes } from "../../redux/store";
import { setMyOwnMsg } from "../../redux/slices/myOwnMsgSlice";
import { Peer } from "peerjs";

interface UsersType {
  name: string;
  _id: string;
  picture: string;
}

export const ChatFooter = () => {
  const [content, setContent] = useState<string>("");
  const socket = useSocket();
  const { state }: { state: UsersType } = useLocation();
  const dispatch = useDispatch();

  // const peer = new Peer({
  //   host: "0.peerjs.com",
  //   port: 443,
  //   path: "/",
  //   pingInterval: 5000,
  // });

  const handleAudio = (): void => {
    navigator.mediaDevices
      .getUserMedia({ audio: true })
      .then((res) => console.log(res))
      .catch((err) => console.log(err));
  };

  const handleSendMsg = (): void => {
    if (content.length > 0) {
      socket?.emit("chat", {
        recipient: state._id,
        message: content,
        sender: "me",
      });
      dispatch(setMyOwnMsg(content));
    } else {
      return;
    }
  };

  useEffect(() => {
    socket?.on("chat", (msg) => {
      dispatch(setMessage(msg));
    });
    return () => {
      socket?.off("chat");
    };
  }, [socket]);

  return (
    <div className="h-[60%] flex justify-evenly md:justify-center items-center w-full gap-1 md:gap-7 md:w-[70%]">
      <input type="file" id="fileInput" className="hidden" />
      <label
        htmlFor="fileInput"
        className="text-3xl md:text-4xl text-primary cursor-pointer"
      >
        <MdAddCircleOutline />
      </label>

      <textarea
        onChange={(e) => {
          setContent(e.target.value);
        }}
        placeholder="Type something..."
        className="rounded-box bg-base-300 w-[60%] pl-2 p-1 md:p-5 pt-2 text-secondary md:text-lg outline-none resize-none"
      />

      <button
        onClick={handleAudio}
        className="text-xl md:text-2xl text-primary"
      >
        <FaMicrophone />
      </button>

      <button
        onClick={handleSendMsg}
        className="text-primary text-xl md:text-2xl"
      >
        <FaLocationArrow />
      </button>
    </div>
  );
};