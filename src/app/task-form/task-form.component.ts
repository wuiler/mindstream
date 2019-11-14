import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { dateToString, escapeRegExp } from '../shared/misc';
import { DialogService } from '../shared/dialog.service';
import { RouterService } from '../shared/router.service';
import { SettingsService } from '../shared/settings.service';
import { TodoFileService } from '../shared/todo-file.service';
import {
    Task,
    PROJECT_LIST_REGEXP,
    PRIORITY_REGEXP,
    DATESTRING_REGEXP,
    RECURRENCE_REGEXP,
} from '../shared/task';
import { openDatePicker } from '../shared/helpers/date-picker';
import { focusOnInput, enableInputSuggestions } from '../shared/helpers/input';
import { isAndroid, isIOS } from '../shared/helpers/platform';

@Component({
    selector: 'ms-task-form',
    templateUrl: './task-form.component.html',
    styleUrls: ['./task-form.component.scss'],
})
export class TaskFormComponent implements OnInit, AfterViewInit {

    form: FormGroup;
    taskId: number;
    projects: string[];
    projectSuggestionsVisible = false;
    projectSuggestionsLocked = false;
    priorities = ['A', 'B', 'C'];

    @ViewChild('taskTextField', {static: false})
    taskTextField: ElementRef;

    @ViewChild('taskProjectsField', {static: false})
    taskProjectsField: ElementRef;

    constructor(
        private dialog: DialogService,
        private formBuilder: FormBuilder,
        private router: RouterService,
        private route: ActivatedRoute,
        private settings: SettingsService,
        private todoFile: TodoFileService,
    ) { }

    ngOnInit() {
        this.form = this.formBuilder.group({
            text: [
                '',
                Validators.required,
            ],
            projects: [
                this.settings.filter.project,
                Validators.pattern(PROJECT_LIST_REGEXP),
            ],
            priority: [
                '',
                Validators.pattern(PRIORITY_REGEXP),
            ],
            dueDate: [
                '',
                Validators.pattern(DATESTRING_REGEXP),
            ],
            recurrence: [
                '',
                Validators.pattern(RECURRENCE_REGEXP),
            ],
        });
        this.taskId = this.route.snapshot.params.taskId;
        if (this.taskId) {
            // Pre-fill form with data if taskId is provided
            const task = new Task(this.todoFile.todoItems[this.taskId]);
            this.form.setValue(task.toTaskData());
        }
        this.projects = this.todoFile.getProjects();
    }

    ngAfterViewInit(): void {
        // Focus on task text field
        setTimeout(() => {
            focusOnInput(this.taskTextField);
            enableInputSuggestions(this.taskTextField);
        }, 100);
    }

    get title(): string {
        return this.taskId ? 'Edit task' : 'Add task';
    }

    getFilteredProjects(): string[] {
        if (!this.projectSuggestionsVisible) {
            return [];
        }
        const value = this.form.controls.projects.value;
        if (!value) {
            return [];
        }
        const projects = value.split(/\s+/);
        if (projects.length === 0) {
            return [];
        }
        const search = projects[projects.length - 1];
        const searchRegexp = new RegExp(escapeRegExp(search), 'iu');
        return this.projects.filter((project) => {
            return project.search(searchRegexp) !== -1;
        }).sort();
    }

    showProjectSuggestions() {
        this.projectSuggestionsVisible = true;
    }

    hideProjectSuggestions() {
        // On iOS "blur" event is emitted before "tap" event,
        // so we need to delay hiding
        setTimeout(() => {
            if (this.projectSuggestionsLocked) {
                // Unlock suggestion list and move focus back to project field
                this.projectSuggestionsLocked = false;
                this.taskProjectsField.nativeElement.focus();
            } else {
                // Hide suggestion list
                this.projectSuggestionsVisible = false;
            }
        }, 100);
    }

    addProject(project: string) {
        if (isIOS) {
            // Prevent suggestions list from hiding on blur event
            this.projectSuggestionsLocked = true;
        }
        const projects = this.form.controls.projects.value.split(/\s+/);
        projects[projects.length - 1] = project;
        const newValue = projects.join(' ');
        this.form.controls.projects.setValue(newValue);
        if (isAndroid) {
            // Move cursor to the end of string
            this.taskProjectsField.nativeElement.android.setSelection(newValue.length);
        }
    }

    removeProject() {
        const projects = this.form.controls.projects.value.split(/\s+/);
        projects.pop();
        const newValue = projects.join(' ');
        this.form.controls.projects.setValue(newValue);
    }

    setPriority(priority: string): void {
        this.form.controls.priority.setValue(priority);
    }

    setDueToday() {
        const dateStr = dateToString(new Date());
        this.form.controls.dueDate.setValue(dateStr);
    }

    showDatePicker() {
        openDatePicker().then((dateString: string) => {
            this.form.controls.dueDate.setValue(dateString);
        }).catch((error) => {
            console.warn(error);
        });
    }

    showRecurrencePicker() {
        const map = {
            'Every day': '1d',
            'Every week': '1w',
            'Every month': '1m',
        };
        this.dialog.action(
            'Task recurrence',
            'Choose recurrence interval',
            Object.keys(map),
        ).then((result: string) => {
            const recurrence = map[result];
            this.form.controls.recurrence.setValue(recurrence);
        });
    }

    save() {
        if (!this.form.valid) {
            return;
        }
        if (this.taskId) {
            this.todoFile.updateTask(this.taskId, this.form.value);
        } else {
            this.todoFile.createTask(this.form.value);
        }
        this.router.navigate(['/tasks']);
    }

    goBack() {
        this.router.backToPreviousPage();
    }

}
