import { Component, ElementRef, OnInit, AfterViewInit, ViewChild, SimpleChanges } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppData, AppState, AppDataActions } from '../reducers';
import { AppDataService } from '../reducers/appData/appData.service';

import { sortCompletedTasks, Task } from '../shared/task.model';
import { TaskList, countOpenTasks } from '../shared/taskList.model';
import { getCopyOf, isTouchDevice, moveToMacroQueue, shortenText } from '../shared/utility.model';
import { ModalService } from './molecules/modal/modal.service';
import { DialogService } from './organisms/custom-dialog';
import { EditMenuService } from './organisms/edit-menu';

import { Subject } from 'rxjs';
import { WINDOW_TITLE_SUFFIX } from '../shared/constants';
import { CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.css'],
})
export class AppComponent {
    data: AppData;
    activeTaskList: TaskList | undefined;
    taskNameInput: string;

    showCompletedMaster = false;
    showCompleted = this.showCompletedMaster;

    countOpenTasks = countOpenTasks;

    isTouchDevice = isTouchDevice();
    isMobileMenuOpen: boolean;
    setMobileMenuOpen = (e: boolean) => (this.isMobileMenuOpen = e);

    quickAddInputField = {
        focusEventsSubject: [new Subject<boolean>(), new Subject<boolean>()],
        focus: (inputField: number) => this.quickAddInputField.focusEventsSubject[inputField].next(true),
    };

    constructor(
        public modalService: ModalService,
        private dialogService: DialogService,
        private editMenuService: EditMenuService,
        private store: Store<AppState>,
        private appDataService: AppDataService
    ) {
        this.store.subscribe(data => {
            this.data = data.appData;
            this.activeTaskList = this.getListById(this.data.activeListId);

            console.log('%cupdated state:', 'color: gray', this.data);

            document.title = this.activeTaskList
                ? `${shortenText(this.activeTaskList.name, 20)} - ${WINDOW_TITLE_SUFFIX}`
                : WINDOW_TITLE_SUFFIX;
        });
    }

    ///////////////////////////////////////////// Tasks ////////////////////////////////////////////////

    addTask = [
        (newTaskName: string) => {
            if (!newTaskName) return;
            if (this.data.lists.length == 0) {
                this.dialogService.confirm({ title: "You don't have any lists." });
                return;
            }
            this.dispatchCreateTask(newTaskName);
            this.quickAddInputField.focus(0);
        },
        (newTaskName: string) => {
            this.dispatchCreateTask(newTaskName);
            this.quickAddInputField.focus(1);
        },
    ];
    dispatchCreateTask = (newTaskName: string) =>
        this.store.dispatch(new AppDataActions.CreateTask(this.activeTaskList.id, newTaskName));

    getTaskById(taskId: string, taskList: Task[], getParentArr = false) {
        const recurse = (taskId: string, arr: Task[]): Task | Task[] | void => {
            for (let i in arr) {
                const task: Task = arr[i];

                if (task.id == taskId) return getParentArr ? arr : task;
                else if (task.subTasks.length != 0) {
                    const taskRef = recurse(taskId, task.subTasks);
                    if (taskRef) return taskRef;
                }
            }
        };
        return recurse(taskId, taskList);
    }
    sortableTaskData: Task[];
    dropTask(event: CdkDragDrop<string[]>) {
        moveItemInArray(this.sortableTaskData, event.previousIndex, event.currentIndex);
        this.sortTasks(this.sortableTaskData);
    }
    sortTasks(sortedTasks: Task[]) {
        console.log('sort Tasks');
        // this.store.dispatch(new AppDataActions.)
    }

    ///////////////////////////////////////////// Lists ////////////////////////////////////////////////
    getListById = (id: string): TaskList | undefined => this.data.lists.find(list => list.id == id);
    getListIndexById = (id: string): number => this.data.lists.indexOf(this.data.lists.find(list => list.id == id));

    setActiveList = (listId: string) => {
        this.store.dispatch(new AppDataActions.SetActiveList(listId));
        this.isMobileMenuOpen = false;
    };
    createList = () =>
        this.dialogService
            .prompt({ title: 'Create new list:', buttons: ['Cancel', 'Create'], placeholder: 'list name' })
            .then((newListName: string) => {
                this.store.dispatch(new AppDataActions.CreateList(newListName));
                this.setMobileMenuOpen(false);
            })
            .catch(() => {});

    editList = (listId: string = this.data.activeListId) => {
        const taskList = this.getListById(listId);

        this.editMenuService
            .editTaskListDetails(taskList)
            .then((updatedTaskList: TaskList) => {
                this.store.dispatch(new AppDataActions.EditList(listId, { ...taskList, ...updatedTaskList }));
            })
            .catch(err => {
                if (err == 'Deleted')
                    this.dialogService
                        .confirm({ title: 'Delete this list?', buttons: ['Cancel', '!Delete'] })
                        .then(() => this.deleteList(listId))
                        .catch(err => {});
            });
    };
    deleteList = (listId: string) => this.store.dispatch(new AppDataActions.DeleteList(listId));
    sortLists(sortedLists: TaskList[]) {
        this.store.dispatch(new AppDataActions.SortLists(sortedLists));
    }

    ////////////////////////////////////// database interaction /////////////////////////////////////////
    db = {
        exportActiveList: () =>
            this.dialogService
                .confirm({ title: `Download this list as file?`, buttons: ['Cancel', 'Download'] })
                .then(() => this.appDataService.exportAsJSON())
                .catch(err => {}),
        importJson: async (inputRef: any) => {
            try {
                const unparsed = await inputRef.files[0].text();
                const jsonData = JSON.parse(unparsed.replace(/metaData/g, 'meta'));

                if ('appData' in jsonData) {
                    const appData = jsonData.appData;
                    if ('activeListId' in appData && 'lists' in appData) {
                        // const data: AppData = getCopyOf(this.data);
                        // // TODO: add a prompt wich lets the user select wich lists to import
                        // data.lists = [...this.data.lists, ...appData.lists];
                        this.appDataService.importFromJSON(appData);
                    } else this.dialogService.confirm({ title: 'The JSON File does not contain the necessary data.' });
                } else this.dialogService.confirm({ title: 'The JSON File might not be what you think it is.' });
            } catch (e) {
                this.dialogService.confirm({ title: 'Failed to import JSON file.', text: 'Have you modified it?' });
                console.error('Failed to parse JSON: ' + e);
            }
        },
    };

    ngAfterViewInit() {
        // this.nameInputRef.nativeElement.select();
        this.quickAddInputField.focus(0);

        if (this.isTouchDevice) document.body.classList.add('touchDevice');
    }
}
