import { ReactElement } from "react";
import { Link } from "react-router-dom";

export const HomeList = (prop: { name: string }): ReactElement => {
  return (
    <>
      <div className="md:w-[50%]">
        <Link to={'/chat'}>
        <div className="flex justify-between p-4 hover:bg-base-200">
          <div className="flex items-center">
            <img className="avatar rounded-full w-11 md:w-14" alt="img" />
          </div>
          <div className="flex flex-col gap-2 justify-evenly items-center">
            <h2 className="text-white text-sm md:text-xl">{prop.name}</h2>
            <span className="text-secondary text-xs md:text-lg">hai..</span>
          </div>
          <div className="flex flex-col items-center gap-2 justify-evenly">
            <span className="text-secondary text-xs md:text-lg">10:30</span>
            <span className="badge badge-primary badge-sm md:badge-md">3</span>
          </div>
        </div>
        </Link>
      </div>
    </>
  );
};
