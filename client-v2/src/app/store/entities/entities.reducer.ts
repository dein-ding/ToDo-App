import { createReducer, on } from '@ngrx/store'
import { EntityPreviewRecursive, EntityType } from 'src/app/fullstack-shared-models/entities.model'
import { TasklistDetail } from 'src/app/fullstack-shared-models/list.model'
import { TaskPreview } from 'src/app/fullstack-shared-models/task.model'
import { entitiesActions, listActions, taskActions } from './entities.actions'
import { EntitiesState } from './entities.state'
import { getParentByChildId, getEntityById, buildEntityTree } from './utils'

const initialState: EntitiesState = {
    entityTree: null,
    taskTreeMap: null,

    [EntityType.TASKLIST]: null,

    // ...(Object.fromEntries(Object.values(EntityType).map(key => [key, null])) as Record<EntityType, null>),
}

export const entitiesReducer = createReducer(
    initialState,

    on(entitiesActions.loadPreviewsSuccess, (state, { previews }): EntitiesState => {
        return {
            ...state,
            entityTree: buildEntityTree(previews),
        }
    }),

    on(entitiesActions.loadDetailSuccess, (state, { entityType, id, entityDetail }): EntitiesState => {
        return {
            ...state,
            [entityType]: {
                ...(state[entityType] || {}),
                [id]: {
                    ...(state[entityType]?.[id] || {}),
                    ...entityDetail,
                },
            },
        } as EntitiesState
    }),

    on(entitiesActions.renameSuccess, (state, { id, title }): EntitiesState => {
        const entityTreeCopy = structuredClone(state.entityTree)
        const entity = getEntityById(entityTreeCopy, id)
        if (!entity) return state

        entity.title = title

        return {
            ...state,
            entityTree: entityTreeCopy,
        }
    }),

    on(entitiesActions.deleteSuccess, (state, { id }): EntitiesState => {
        const entityTreeCopy = structuredClone(state.entityTree)
        const result = getParentByChildId(entityTreeCopy, id)
        if (!result) return state

        result.subTree.splice(result.index, 1)

        return { ...state, entityTree: entityTreeCopy }
    }),

    ////////////////////////////////// Tasklist ////////////////////////////////////
    on(listActions.createTaskListSuccess, (state, { createdList: { parentListId, ...createdList } }): EntitiesState => {
        const listEntity: EntityPreviewRecursive = {
            ...createdList,
            entityType: EntityType.TASKLIST,
            parentId: parentListId,
            children: [],
        }

        if (!parentListId)
            return {
                ...state,
                entityTree: [...(state.entityTree || []), listEntity],
            }

        const entityTreeCopy = structuredClone(state.entityTree)
        const parentList = getEntityById(entityTreeCopy, parentListId)

        if (!parentList)
            return {
                ...state,
                entityTree: [...(state.entityTree || []), listEntity],
            }

        parentList.children.push(listEntity)

        return {
            ...state,
            entityTree: entityTreeCopy,
        }
    }),
    on(listActions.updateDescriptionSuccess, (state, { id, newDescription }): EntitiesState => {
        const otherTasklistDetails = state[EntityType.TASKLIST] || {}
        const previousTasklistDetail = state[EntityType.TASKLIST]?.[id] || ({} as TasklistDetail)
        return {
            ...state,
            [EntityType.TASKLIST]: {
                ...otherTasklistDetails,
                [id]: {
                    ...previousTasklistDetail,
                    description: newDescription,
                },
            },
        }
    }),

    ////////////////////////////////// Task ////////////////////////////////////
    on(taskActions.loadRootLevelTasksSuccess, (state, { listId: id, tasks }): EntitiesState => {
        return {
            ...state,
            taskTreeMap: {
                ...(state.taskTreeMap || {}),
                [id]: tasks,
            },
        }
    }),

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    on(taskActions.createSuccess, (state, { type, ...task }): EntitiesState => {
        const previousTasks: TaskPreview[] = state.taskTreeMap?.[task.listId] || []
        return {
            ...state,
            taskTreeMap: {
                ...(state.taskTreeMap || {}),
                [task.listId]: [...previousTasks, task],
            },
        }
    })
)
