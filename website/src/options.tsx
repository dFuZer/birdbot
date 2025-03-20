import { BookOpenIcon, ClockIcon } from "@heroicons/react/24/outline";
import React from "react";

enum Records {
    WORDS = "words",
    TIME = "time",
}

interface IRecordData {
    displayName: string;
    getIcon: (classes: string) => React.ReactElement;
}

const RECORDS: { [key in Records]: IRecordData } = {
    time: { displayName: "Time", getIcon: (classes) => <ClockIcon className={classes} /> },
    words: { displayName: "Words", getIcon: (classes) => <BookOpenIcon className={classes} /> },
};
