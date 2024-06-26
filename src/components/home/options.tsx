import { Loader2, Plus } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import CreateGroup from "../group/createGroup";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import ChangeUsername from "../common/ChangeUsername";
import { useMutation } from "react-query";
import { logoutApi } from "@/services/api/auth";
import { useToast } from "../ui/use-toast";

const Options = () => {
  const navigate = useNavigate();
  const [isCreateGroupModalOpen, setIsCreateGroupModalOpen] = useState(false);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isChangeUsernameModalOpen, setIsChangeUsernameModalOpen] =
    useState(false);
  const { mutate: logoutMutate, isLoading: logoutIsLoading } =
    useMutation(logoutApi);
  const { toast } = useToast();

  const handleLogout = () => {
    logoutMutate(
      {},
      {
        onSuccess: () => {
          toast({
            title: "Logout Successful",
            description: "You have been logged out successfully",
          });
          navigate("/auth");
        },
      }
    );
  };

  return (
    <div className="w-full max-w-lg mx-auto p-4 ">
      <div className="fixed bottom-7 right-5 md:bottom-6 md:right-6">
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button
              variant={"secondary"}
              size={"icon"}
              className="rounded-full h-12 w-12"
            >
              <Plus className="h-5 w-5" strokeWidth={3} />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="mr-3">
            <DropdownMenuLabel>Options</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="grid gap-2">
              <DropdownMenuItem
                className="cursor-pointer hover:bg-muted"
                onClick={() => setIsCreateGroupModalOpen(true)}
              >
                Create group
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-muted"
                onClick={() => setIsChangeUsernameModalOpen(true)}
              >
                Change username
              </DropdownMenuItem>
              <DropdownMenuItem
                className="cursor-pointer hover:bg-muted"
                onClick={() => setIsLogoutModalOpen(true)}
              >
                Logout
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {isCreateGroupModalOpen && (
        <CreateGroup
          onClose={() => setIsCreateGroupModalOpen(false)}
          isCreateGroupModalOpen={isCreateGroupModalOpen}
        />
      )}
      {isLogoutModalOpen && (
        <AlertDialog open={isLogoutModalOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure to logout?</AlertDialogTitle>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setIsLogoutModalOpen(false)}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleLogout}>
                {logoutIsLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  "Logout"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
      {isChangeUsernameModalOpen && (
        <ChangeUsername
          onClose={() => setIsChangeUsernameModalOpen(false)}
          isChangeUsernameModalOpen={isChangeUsernameModalOpen}
        />
      )}
    </div>
  );
};

export default Options;
