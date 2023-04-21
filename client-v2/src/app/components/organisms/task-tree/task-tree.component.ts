import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { Store } from '@ngrx/store'
import { BehaviorSubject, combineLatestWith, map, shareReplay, tap } from 'rxjs'
import { EntityType } from 'src/app/fullstack-shared-models/entities.model'
import {
    TaskPreviewFlattend,
    TaskPreviewRecursive,
    TaskPriority,
    TaskStatus,
} from 'src/app/fullstack-shared-models/task.model'
import { LoadingStateService } from 'src/app/services/loading-state.service'
import { UiStateService } from 'src/app/services/ui-state.service'
import { uiDefaults } from 'src/app/shared/defaults'
import { getEntityMenuItemsMap } from 'src/app/shared/entity-menu-items'
import { AppState } from 'src/app/store'
import { entitiesActions } from 'src/app/store/entities/entities.actions'
import { taskActions } from 'src/app/store/entities/task/task.actions'
import { flattenTaskTree } from 'src/app/store/entities/utils'
import { useTaskForActiveItems } from 'src/app/utils/menu-item.helpers'

export interface TaskTreeNode {
    taskPreview: TaskPreviewFlattend
    hasChildren: boolean
    isExpanded: boolean
    isDescriptionExpanded: boolean
    path: string[]
}

export const convertToTaskTreeNode = (task: TaskPreviewFlattend, expand?: boolean): TaskTreeNode => {
    return {
        taskPreview: task,
        hasChildren: task.childrenCount > 0,
        isExpanded: expand ?? uiDefaults.mainView.IS_TASK_EXPANDED,
        isDescriptionExpanded: expand ?? uiDefaults.mainView.IS_TASK_DESCRIPTION_EXPANDED,
        path: task.path,
    }
}

@Component({
    selector: 'app-task-tree',
    templateUrl: './task-tree.component.html',
    styleUrls: ['./task-tree.component.css'],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TaskTreeComponent {
    constructor(
        private store: Store<AppState>,
        private loadingService: LoadingStateService,
        private uiStateService: UiStateService
    ) {}

    tasks$ = new BehaviorSubject<TaskPreviewRecursive[] | null>(null)
    @Input() set tasks(tasks: TaskPreviewRecursive[]) {
        this.tasks$.next(tasks)
    }
    @Input() highlightQuery = ''
    @Input() expandAll?: boolean

    flattendTaskTree$ = this.tasks$.pipe(
        map(tasks => {
            if (!tasks) return []
            const treeNodes = flattenTaskTree(tasks).map(task => {
                const treeNode = convertToTaskTreeNode(task, this.expandAll)

                treeNode.isExpanded =
                    this.expandAll ?? this.entityExpandedMap.get(task.id) ?? uiDefaults.mainView.IS_TASK_EXPANDED
                treeNode.isDescriptionExpanded =
                    (task.description ? this.expandAll : null) ??
                    this.descriptionExpandedMap.get(task.id) ??
                    uiDefaults.mainView.IS_TASK_DESCRIPTION_EXPANDED

                return treeNode
            })
            return treeNodes
        })
    )

    uiChangeEvents = new BehaviorSubject<{
        id: string
        key: 'isExpanded' | 'isDescriptionExpanded'
        value: boolean
    } | null>(null)

    descriptionExpandedMap = this.uiStateService.mainViewUiState.taskTreeDescriptionExpandedMap
    toggleDescriptionExpansion(node: TaskTreeNode, isDescriptionExpanded: boolean) {
        this.uiChangeEvents.next({
            id: node.taskPreview.id,
            key: 'isDescriptionExpanded',
            value: isDescriptionExpanded,
        })

        this.uiStateService.toggleTaskDescription(node.taskPreview.id, isDescriptionExpanded)
    }

    entityExpandedMap = this.uiStateService.mainViewUiState.entityExpandedMap
    toggleExpansion(node: TaskTreeNode, isExpanded: boolean) {
        this.uiChangeEvents.next({ id: node.taskPreview.id, key: 'isExpanded', value: isExpanded })

        this.uiStateService.toggleMainViewEntity(node.taskPreview.id, isExpanded)
    }

    treeWithUiChanges!: TaskTreeNode[]
    treeWithUiChanges$ = this.flattendTaskTree$.pipe(
        combineLatestWith(this.uiChangeEvents),
        map(([taskNodes, changeEvent]) => {
            if (!changeEvent) return taskNodes

            const taskNodeIndex = taskNodes.findIndex(task => task.taskPreview.id == changeEvent.id)
            const taskNode = taskNodes[taskNodeIndex]

            if (taskNode) {
                // @TODO: Can we find a better solution for this? Perhaps force angular to rerender?
                // Create a new object reference for change detection to kick in
                taskNodes[taskNodeIndex] = { ...taskNode, [changeEvent.key]: changeEvent.value }
            }

            return taskNodes
        }),
        tap(taskNodes => {
            this.treeWithUiChanges = taskNodes
        })
    )

    private getParentNode(node: TaskTreeNode) {
        const nodeIndex = this.treeWithUiChanges.indexOf(node)

        for (let i = nodeIndex - 1; i >= 0; i--) {
            if (this.treeWithUiChanges[i].path.length === node.path.length - 1) {
                return this.treeWithUiChanges[i]
            }
        }

        return null
    }
    shouldRender(node: TaskTreeNode) {
        let parent = this.getParentNode(node)

        while (parent) {
            if (!parent.isExpanded) return false

            parent = this.getParentNode(parent)
        }
        return true
    }

    trackByFn(_index: number, { taskPreview: { id } }: TaskTreeNode) {
        return id
    }

    range(number: number) {
        return new Array(number).fill(null).map((_, index) => index)
    }
    private getNextVisibleNode(index: number, node: TaskTreeNode) {
        let nextNode: TaskTreeNode = node
        while (!this.shouldRender(nextNode)) {
            nextNode = this.treeWithUiChanges[++index]
        }
        return nextNode
    }
    private getNodeAt(index: number, nextVisibleNode = false): TaskTreeNode | undefined {
        const node = this.treeWithUiChanges[index]

        if (nextVisibleNode && !this.shouldRender(node)) {
            return this.getNextVisibleNode(index, node)
        }

        return node
    }
    // is first elem in the current hierarchy
    isPreviousLineSpotATask(nodeIndex: number, lineIndex: number, nodeLevel: number) {
        const previousNode = this.getNodeAt(nodeIndex - 1)
        const previousNodeLevel = previousNode?.path?.length || 0

        return previousNodeLevel + lineIndex < nodeLevel
    }
    // is last elem in the current hierarchy
    isNextLineSpotATask(nodeIndex: number, lineIndex: number, nodeLevel: number) {
        const nextNode = this.getNodeAt(nodeIndex + 1, true)
        const nextNodeLevel = nextNode?.path?.length || 0

        return nextNodeLevel + lineIndex < nodeLevel
    }

    private readonly taskMenuItems = getEntityMenuItemsMap(this.store)[EntityType.TASK]

    menuItemsMap$ = this.flattendTaskTree$.pipe(
        map(flattendTree => {
            const menuItemEntries = flattendTree.map(({ taskPreview }) => {
                const menuItems = this.taskMenuItems.map(useTaskForActiveItems(taskPreview))

                return [taskPreview.id, menuItems] as const
            })
            return Object.fromEntries(menuItemEntries)
        }),
        shareReplay({ bufferSize: 1, refCount: true })
    )

    isLoadingMap$ = this.loadingService.getEntitiesLoadingStateMap(action =>
        this.flattendTaskTree$.pipe(map(tasks => tasks.some(task => task.taskPreview.id == action.id)))
    )

    onTitleChange(id: string, title: string) {
        this.store.dispatch(entitiesActions.rename({ id, title, entityType: EntityType.TASK }))
    }
    onDescriptionChange(id: string, newDescription: string) {
        this.store.dispatch(taskActions.updateDescription({ id, newDescription }))
    }
    onStatusChange(id: string, status: TaskStatus) {
        this.store.dispatch(taskActions.updateStatus({ id, status }))
    }
    onPriorityChange(id: string, priority: TaskPriority) {
        this.store.dispatch(taskActions.updatePriority({ id, priority }))
    }
}
