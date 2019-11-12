import { NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { BrowserModule } from '@angular/platform-browser';

import { NgxSmartModalModule } from 'ngx-smart-modal';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { DialogComponent } from './shared/dialog.component';
import { PlainTextComponent } from './plaintext/plaintext.component';
import { SettingsComponent } from './settings/settings.component';
import { TaskFormComponent } from './task-form/task-form.component';
import { TaskListComponent } from './task-list/task-list.component';
import { ProjectListComponent } from './project-list/project-list.component';
import { WelcomeComponent } from './welcome/welcome.component';

@NgModule({
    declarations: [
        AppComponent,
        DialogComponent,
        PlainTextComponent,
        SettingsComponent,
        TaskFormComponent,
        TaskListComponent,
        ProjectListComponent,
        WelcomeComponent,
    ],
    entryComponents: [
        DialogComponent,
    ],
    imports: [
        HttpClientModule,
        ReactiveFormsModule,
        BrowserModule,
        NgxSmartModalModule.forRoot(),
        AppRoutingModule,
    ],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule { }
