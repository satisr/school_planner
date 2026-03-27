import { TableLesson } from '@wulkanowy/timetable-parser';

export interface UserLessonEdit {
    subject?: string;
    teacher?: string;
    room?: string;
    groupName?: string;
    className?: string;
    deleted?: boolean;
    isNew?: boolean;
    note?: string;
}

export interface UserBreakEdit {
    note: string;
}

// Map: dayIndex -> hourIndex -> array of lessons (since one hour can have multiple groups)
export type UserLessonsMap = Record<number, Record<number, UserLessonEdit[]>>;

// Map: dayIndex -> breakIndex (hourIndex) -> note
export type UserBreaksMap = Record<number, Record<number, UserBreakEdit>>;

export interface UserTimetableEdits {
    lessons: UserLessonsMap;
    breaks: UserBreaksMap;
}

const STORAGE_KEY_PREFIX = 'timetable_edits_';

export function getEditsKey(timetableId: string): string {
    return `${STORAGE_KEY_PREFIX}${timetableId}`;
}

export function loadUserEdits(timetableId: string): UserTimetableEdits {
    if (typeof window === 'undefined') {
        return { lessons: {}, breaks: {} };
    }

    try {
        const data = localStorage.getItem(getEditsKey(timetableId));
        if (data) {
            return JSON.parse(data) as UserTimetableEdits;
        }
    } catch (e) {
        console.error('Failed to load user edits from localStorage', e);
    }
    return { lessons: {}, breaks: {} };
}

export function saveUserEdits(timetableId: string, edits: UserTimetableEdits): void {
    if (typeof window === 'undefined') return;

    try {
        localStorage.setItem(getEditsKey(timetableId), JSON.stringify(edits));
    } catch (e) {
        console.error('Failed to save user edits to localStorage', e);
    }
}
