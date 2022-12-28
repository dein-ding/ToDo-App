import { TasklistPreview } from './list.model'

export enum EntityType {
    TASKLIST = 'Tasklist',
    // TASK = 'Task',
    // DOCUMENT = 'Document',
    // VIEW = 'View',
}

// export interface EntityPreview {
//     id: string
//     type: EntityType
//     name: string
//     parentId: string | undefined
//     children: string[]
// }
// export type EntityPreviewRecursive = EntityPreview & {
//     children: EntityPreviewRecursive[]
// }
// export type EntityPreviewFlattend = Omit<EntityPreviewRecursive, 'children'> & {
//     path: string[]
//     childrenCount: number
// }

// @TODO: convert to real Entity-interfaces above
export type EntityPreviewRecursive = Omit<TasklistPreview, 'childLists'> & {
    children: EntityPreviewRecursive[]
}
export type EntityPreviewFlattend = Omit<EntityPreviewRecursive, 'children'> & {
    path: string[]
    childrenCount: number
}