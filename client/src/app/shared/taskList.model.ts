import { Task } from './task.model';
import { generateId } from './utility.model';

export class TaskList {
    constructor(name = 'ToDo', list: Task[] = []) {
        this.name = name;
        this.id = generateId();
        this.list = list;
    }
    public name: string;
    public id: string;
    public list: Task[];
    public meta = {
        notes: '',
    };
    public sortBy = {
        completion: true,
        priority: true,
    };
}

export const countOpenTasks = (arr: Task[]) => arr.filter(task => !task.isCompleted).length;
export const countOpenTasksAll = (tasks: Task[]) => {
    let uncompleted = 0;
    const recurse = (tasks_: Task[]) =>
        tasks_.forEach(task => {
            if (!task.isCompleted) uncompleted++;
            if (task.subTasks.length) recurse(task.subTasks);
        });
    recurse(tasks);
    return uncompleted;
};

export const sortTasksBy = (tasks: Task[], property: string) => {
    const typeOfProperty = property == 'priority' ? 'number' : typeof tasks[0][property];

    let sort: (arr: Task[]) => Task[];
    switch (typeOfProperty) {
        case 'number':
            sort = arr => arr.reverse().sort((a, b) => parseInt(a[property]) - parseInt(b[property])).reverse(); break; //prettier-ignore
        case 'boolean':
            sort = arr => arr.sort((a, b) => (a[property] === b[property] ? 0 : b[property] ? -1 : 1)); break; //prettier-ignore
    }

    const recurse = (tasks_: Task[]) => {
        sort(tasks_);
        tasks_.forEach(task => {
            if (task.subTasks.length) recurse(task.subTasks);
        });
    };
    recurse(tasks);
};
