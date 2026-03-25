import { TableHour, TableLesson, ListItem } from '@wulkanowy/timetable-parser';

export interface TimetableList {
    classes: ListItem[];
    teachers?: ListItem[];
    rooms?: ListItem[];
    urlBase: string;
}

export interface TimetableData {
    title: string;
    hours: {
        [key: string]: TableHour;
    };
    days: (TableLesson[] | null)[][]; // Outer array = days, middle array = timeslots, inner array = lessons (groups)
}
