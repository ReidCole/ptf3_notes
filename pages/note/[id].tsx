import dayjs from "dayjs";
import { doc, getDoc } from "firebase/firestore";
import { NextPage } from "next";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import LoadingSpinner from "../../components/LoadingSpinner";
import MainContainer from "../../components/MainContainer";
import MobileNavbar from "../../components/MobileNavbar";
import NoteButtons from "../../components/NoteButtons";
import NoteInputs from "../../components/NoteInputs";
import Notification from "../../components/Notification";
import PageHeading from "../../components/PageHeading";
import useNotificationState from "../../hooks/useNotificationState";
import { RootState } from "../../redux";
import { noteActions } from "../../redux/noteReducer";
import { getCurrentLocalStorageNotes, NoteType, typeNote, typeNotes } from "../../util/noteUtils";
import { firestore } from "../_app";

const Note: NextPage = () => {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const currentNote = useSelector((state: RootState) => state.note.currentNote);
  const [error, setError] = useState<string>("");
  const dispatch = useDispatch();

  useEffect(() => {
    async function getNoteFromAccount(id: string) {
      try {
        setIsLoading(true);
        const noteDoc = doc(firestore, `notes/${id}`);
        const snapshot = await getDoc(noteDoc);
        if (!snapshot.exists()) {
          console.log("todo: show screen for note doesn't exist");
          setIsLoading(false);
          return;
        }
        const data = snapshot.data();
        const newNote = typeNote(data);
        setIsLoading(false);
        dispatch({ type: noteActions.setNote, payload: newNote });
      } catch (e: any) {
        let errorMsg = "";
        switch (e.code) {
          case "permission-denied":
            errorMsg = "This note does not exist, or the owner has set it as private.";
            break;
          default:
            errorMsg = "Something went wrong while loading this note.";
            break;
        }
        console.log(e.code);
        setError(errorMsg);
      }
    }

    function getNoteFromLocalStorage(id: string) {
      const typedNotes = getCurrentLocalStorageNotes();
      const newNote = typedNotes.find((note) => note.id === id);
      if (typeof newNote === "undefined") {
        console.error("todo: couldn't find note in local storage");
        setError("Couldn't find the requested note in browser storage.");
        return;
      }
      dispatch({ type: noteActions.setNote, payload: newNote });
    }

    const id = router.query.id;
    const isLocal = router.query.local;
    if (typeof id !== "string") return;
    if (isLocal === "true") {
      getNoteFromLocalStorage(id);
    } else {
      getNoteFromAccount(id);
    }
  }, [router.query, dispatch]);

  if (error.length > 0) {
    return (
      <MainContainer>
        <div className="bg-red-500 p-4 text-white text-center">{error}</div>
        <div className="h-full"></div>
        <MobileNavbar />
      </MainContainer>
    );
  }

  return (
    <MainContainer>
      <>
        <PageHeading>View Note</PageHeading>

        {isEditing ? (
          <NoteInputs />
        ) : (
          <>
            <div className="px-2 flex flex-col">
              <h2 className="px-2 pb-1 font-bold text-xl">{currentNote.title}</h2>
              <p className="px-2 mb-1 text-sm italic text-gray-600 border-gray-300">
                Created by {currentNote.owner == "ls" ? "You (Browser Storage)" : currentNote.owner}{" "}
                on {dayjs(currentNote.dateCreated).toString()}
              </p>
            </div>
            <div className="m-2 p-1 bg-gray-200 border border-gray-300 h-full overflow-y-scroll">
              <p className="p-2 rounded-lg">{currentNote.body}</p>
            </div>
          </>
        )}

        <NoteButtons isEditing={isEditing} setIsEditing={setIsEditing} />
      </>

      <MobileNavbar />

      <LoadingSpinner isVisible={isLoading} />
    </MainContainer>
  );
};

export default Note;
