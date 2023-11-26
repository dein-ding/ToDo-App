import { createActionGroup, props } from '@ngrx/store'
import { CreateTasklistDto, TaskList } from 'src/app/fullstack-shared-models/list.model'
import { HttpServerErrorResponse, HttpServerErrorResponseWithMeta } from 'src/app/http/types'

export const listActions = createActionGroup({
    source: 'Entity/Lists',
    events: {
        'create task list': props<Partial<CreateTasklistDto>>(),
        'create task list success': props<{ createdList: TaskList }>(),
        'create task list error': props<HttpServerErrorResponse>(),

        'update description': props<{ id: string; newDescription: string }>(),
        'update description success': props<{ id: string; newDescription: string }>(),
        'update description error': props<HttpServerErrorResponseWithMeta>(),

        'duplicate list': props<{ id: string }>(),
        'duplicate list success': props<{ id: string }>(),
        'duplicate list error': props<{ id: string }>(),

        'export list': props<{ id: string }>(),
    },
})
