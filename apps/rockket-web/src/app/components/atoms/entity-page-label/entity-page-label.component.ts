import { ChangeDetectionStrategy, Component, Input } from '@angular/core'
import { IconKey } from '../icons/icon/icons'

@Component({
    selector: 'app-entity-page-label',
    template: `
        <span class="inline-flex justify-center">
            <app-icon class="icon | text-md w-4d mr-1 inline-block" [icon]="pageIcon"></app-icon>
        </span>
        <span class="title | truncate">{{ pageTitle }}</span>
    `,
    styles: [
        `
            :host {
                @apply pointer-events-none truncate text-left;
            }
        `,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EntityPageLabelComponent {
    @Input() pageTitle!: string
    @Input() pageIcon!: IconKey | string
}