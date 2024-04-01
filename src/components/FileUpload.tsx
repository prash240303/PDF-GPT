"use client";
import { uploadToS3 } from "@/lib/s3";
import { useMutation } from "@tanstack/react-query";
import { Inbox, Loader2 } from "lucide-react";
import React from "react";
import { useDropzone } from "react-dropzone";
import axios from "axios";
import { toast } from "react-hot-toast";
import { useRouter } from "next/navigation";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"

// https://github.com/aws/aws-sdk-js-v3/issues/4126

const FileUpload = () => {
  const router = useRouter();
  const [showDialog, setShowDialog] = React.useState(true); // Show dialog by default
  const [uploading, setUploading] = React.useState(false);
  const { mutate } = useMutation({
    mutationFn: async ({
      file_key,
      file_name,
    }: {
      file_key: string;
      file_name: string;
    }) => {
      const response = await axios.post("/api/create-chat", {
        file_key,
        file_name,
      });
      return response.data;
    },
  });

  const { getRootProps, getInputProps } = useDropzone({
    accept: { "application/pdf": [".pdf"] },
    maxFiles: 1,
    onDrop: async (acceptedFiles) => {
      const file = acceptedFiles[0];
      if (file.size > 10 * 1024 * 1024) {
        // bigger than 10mb!
        toast.error("File too large");
        return;
      }

      try {
        setUploading(true);
        const data = await uploadToS3(file);
        console.log("meow", data);
        if (!data?.file_key || !data.file_name) {
          toast.error("Something went wrong");
          return;
        }
        mutate(data, {
          onSuccess: ({ chat_id }) => {
            toast.success("Chat created!");
            router.push(`/chat/${chat_id}`);
          },
          onError: (err) => {
            toast.error("Error creating chat");
            // show the alert dialog here
            setShowDialog(true);
            console.error(err);
          },
        });
      } catch (error) {
        console.log(error);
      } finally {
        setUploading(false);
      }
    },
  });
  
  React.useEffect(() => {
    // Close the dialog after a certain delay
    const timeout = setTimeout(() => {
      setShowDialog(false);
    }, 3000); // Adjust the delay as needed

    // Clear the timeout when the component unmounts
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="p-2 border border-gray-300 bg-white rounded-2xl">
      <div
        {...getRootProps({
          className:
            "border-dashed w-full border-2 rounded-xl cursor-pointer bg-gray-100 py-8 px-6 flex justify-center items-center flex-col",
        })}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <>
            {/* loading state */}
            <Loader2 className="h-10 w-10 text-primary-300 animate-spin" />
            <p className="mt-2 text-sm text-slate-400">
              Spilling Tea to GPT...
            </p>
          </>
        ) : (
          <>
            <Inbox className="w-10 h-10 text-primary-200" />
            <p className="mt-2 text-base font-semibold  text-slate-600">Drag PDF File</p>
            <p className="mt-2 w-full text-sm text-slate-400">Click to upload file (PDF file should be under 10 MB )</p>
          </>
        )}
      </div>

      {showDialog && (
        <AlertDialog>
            <AlertDialogTrigger>Open</AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your account
                and remove your data from our servers.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
};

export default FileUpload;



