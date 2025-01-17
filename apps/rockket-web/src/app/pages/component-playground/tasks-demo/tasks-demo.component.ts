import { Component } from '@angular/core'
import {
    prioritySortingMap,
    statusSortingMap,
    Task,
    TaskFlattend,
    TaskPriority,
    TaskStatus,
} from '@rockket/commons'
import {
    convertToTaskTreeNode,
    TaskTreeNode,
} from 'src/app/components/organisms/task-tree/task-tree.component'

type TaskSorter = (a: Task, b: Task) => number

const sortByStatus: TaskSorter = (a, b) => statusSortingMap[a.status] - statusSortingMap[b.status]
const sortByPriority: TaskSorter = (a, b) => prioritySortingMap[a.priority] - prioritySortingMap[b.priority]

const tasklist = Object.values(TaskStatus)
    .map(status =>
        Object.values(TaskPriority).map<Task>((priority, i) => ({
            title: `This is a task (${status}, ${priority})`,
            description:
                i % 2 == 0
                    ? ''
                    : 'Here could be notes. Or even multiline notes? fhsdjkalf hasjksldhjafksldf hasjkdlfjkasldhfjkas ldhfjka lsdhfjklashdjfk lashdfjklas dhfjk',
            status,
            priority,
            id: '',
            listId: '',
            parentTaskId: '',
            createdAt: new Date(),
            statusUpdatedAt: new Date(),
            deadline: null,
            ownerId: '5',
        })),
    )
    .flat()

const sortTasklist = (tasklist: Task[]) => {
    const openTasks = tasklist
        .filter(
            // Prettier-ignore
            t =>
                t.status != TaskStatus.Discarded &&
                t.status != TaskStatus.Completed &&
                t.status != TaskStatus.Backlog,
        )
        .sort(sortByStatus)
        .sort(sortByPriority)
    const backlogTasks = tasklist.filter(t => t.status == TaskStatus.Backlog).sort(sortByPriority)
    const closedTasks = tasklist.filter(
        t => t.status == TaskStatus.Discarded || t.status == TaskStatus.Completed,
    ) // @TODO: sort by closedAt

    return [...openTasks, ...backlogTasks, ...closedTasks]
}

@Component({
    selector: 'app-tasks-demo',
    templateUrl: './tasks-demo.component.html',
    styleUrls: [],
})
export class TasksDemoComponent {
    tasks: TaskTreeNode[] = sortTasklist(tasklist)
        .map<TaskFlattend>(task => ({
            ...task,
            path: [],
            children: [],
        }))
        .map(node => convertToTaskTreeNode(node))
}
