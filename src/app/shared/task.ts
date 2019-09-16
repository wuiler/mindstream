import { TodoTxtItem } from 'jstodotxt';
import { TodoTxtExtension, DueExtension } from 'jstodotxt/jsTodoExtensions';
import * as moment from 'moment';

import { dateToString, stringToDate } from './misc';

export const PROJECT_REGEXP = /^[^+\s]+$/;
export const PRIORITY_REGEXP = /^[A-Z]$/;
export const DATESTRING_REGEXP = /^\d{4}-(0\d|1[0-2])-([0-2]\d|3[01])$/;
export const RECURRENCE_REGEXP = /^([1-7])(d|w|m)$/;
const RECURRENCE_TAG_REGEXP = /rec:([1-7](d|w|m))(\s|$)/;
const RECURRENCE_KEYS = {
    d: 'day',
    w: 'week',
    m: 'month',
};

export class TaskRecurrence {

    amount: number;
    key: string;

    constructor(value: string) {
        const match = value.match(RECURRENCE_REGEXP);
        this.amount = parseInt(match[1]);
        this.key = match[2];
    }

    toString(): string {
        return `${this.amount}${this.key}`;
    }

    addTo(date: Date): Date {
        const mDate = moment(date) as any;
        return mDate.add(this.amount, this.key).toDate();
    }

    display(): string {
        let result = 'every ';
        if (this.amount > 1) {
            result += `${this.amount} `;
        }
        result += RECURRENCE_KEYS[this.key];
        return result;
    }
}

export function RecurrenceExtension() {
    this.name = 'rec';
}

RecurrenceExtension.prototype = new TodoTxtExtension();

RecurrenceExtension.prototype.parsingFunction = (line: string): any[] => {
    // https://github.com/mpcjanssen/simpletask-android/blob/master/app/src/main/assets/index.en.md#extensions
    const match = RECURRENCE_TAG_REGEXP.exec(line);
    if (match) {
        return [
            new TaskRecurrence(match[1]), // rec
            line.replace(RECURRENCE_TAG_REGEXP, ''), // line with tag removed
            match[1], // recString
        ];
    }
    // Return nulls if not found
    return [null, null, null];
};

export function getExtensions(): TodoTxtExtension[] {
    return [
        new DueExtension(),
        new RecurrenceExtension(),
    ];
}

export interface TaskData {
    text: string;
    project: string;
    priority: string;
    dueDate: string;
    recurrence: string;
}

export class Task {

    id: number;
    todoItem: TodoTxtItem;

    constructor(todoItem: TodoTxtItem) {
        this.todoItem = todoItem;
    }

    get text(): string {
        return this.todoItem.text;
    }

    get projects(): string[] {
        return this.todoItem.projects;
    }

    get priority(): string {
        return this.todoItem.priority;
    }

    get due(): Date {
        return this.todoItem.due;
    }

    get rec(): string {
        return this.todoItem.rec;
    }

    get complete(): boolean {
        return this.todoItem.complete;
    }

    get completed(): Date {
        return this.todoItem.completed;
    }

    isOverdue(): boolean {
        if (!this.todoItem.due) {
            return false;
        }
        return moment(this.todoItem.due) < moment().startOf('day');
    }

    static create(taskData: TaskData): Task {
        const todoItem = new TodoTxtItem(taskData.text, getExtensions());
        todoItem.date = new Date();
        if (taskData.project) {
            todoItem.projects = [taskData.project];
        }
        if (taskData.priority) {
            todoItem.priority = taskData.priority;
        }
        if (taskData.dueDate) {
            todoItem.due = stringToDate(taskData.dueDate);
            todoItem.dueString = taskData.dueDate;
        }
        if (taskData.recurrence) {
            todoItem.rec = new TaskRecurrence(taskData.recurrence);
            todoItem.recString = taskData.recurrence;
        }
        return new Task(todoItem);
    }

    static parse(text: string): Task {
        const todoItem = new TodoTxtItem(text, getExtensions());
        return new Task(todoItem);
    }

    clone(): Task {
        const todoItemStr = this.todoItem.toString();
        return Task.parse(todoItemStr);
    }

    update(taskData: TaskData) {
        this.todoItem.text = taskData.text;
        if (taskData.project) {
            this.todoItem.projects = [taskData.project];
        } else {
            this.todoItem.projects = null;
        }
        if (taskData.priority) {
            this.todoItem.priority = taskData.priority;
        } else {
            this.todoItem.priority = null;
        }
        if (taskData.dueDate) {
            this.todoItem.due = stringToDate(taskData.dueDate);
            this.todoItem.dueString = taskData.dueDate;
        } else {
            delete this.todoItem.due;
            delete this.todoItem.dueString;
        }
        if (taskData.recurrence) {
            this.todoItem.rec = new TaskRecurrence(taskData.recurrence);
            this.todoItem.recString = taskData.recurrence;
        } else {
            delete this.todoItem.rec;
            delete this.todoItem.recString;
        }
    }

    toTaskData(): TaskData {
        let project = '';
        if (this.todoItem.projects && this.todoItem.projects.length > 0) {
            project = this.todoItem.projects[0];
        }
        let dueDate = '';
        if (this.todoItem.due) {
            dueDate = dateToString(this.todoItem.due);
        }
        let recurrence = '';
        if (this.todoItem.rec) {
            recurrence = this.todoItem.rec.toString();
        }
        return {
            text: this.todoItem.text,
            project: project,
            priority: this.todoItem.priority,
            dueDate: dueDate,
            recurrence: recurrence,
        };
    }

    toggleComplete() {
        if (!this.todoItem.complete) {
            this.todoItem.complete = true;
            this.todoItem.completed = new Date();
        } else {
            this.todoItem.complete = false;
            this.todoItem.completed = null;
        }
    }

    postpone() {
        if (!this.todoItem.due) {
            return false;
        }
        const newDueDate = new Date(this.todoItem.due);
        newDueDate.setDate(newDueDate.getDate() + 1);
        this.todoItem.due = newDueDate;
        this.todoItem.dueString = dateToString(newDueDate);
        return true;
    }

    recur(): Task {
        if (this.todoItem.due && this.todoItem.rec) {
            const newDueDate = this.todoItem.rec.addTo(this.todoItem.due);
            const newTask = this.clone();
            newTask.todoItem.due = newDueDate;
            newTask.todoItem.dueString = dateToString(newDueDate);
            return newTask;
        }
    }
}
