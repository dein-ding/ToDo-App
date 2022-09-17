import { NgModule } from '@angular/core'
import { BrowserModule } from '@angular/platform-browser'

import { AppRoutingModule } from './app-routing.module'
import { AppComponent } from './app.component'
import { DemoComponent } from './components/demo/demo.component'
import { ComponentPlaygroundComponent } from './pages/component-playground/component-playground.component'
import { FormsModule } from '@angular/forms'

@NgModule({
    declarations: [
        AppComponent,
        DemoComponent,
        ComponentPlaygroundComponent,
    ],
    imports: [BrowserModule, FormsModule, AppRoutingModule],
    providers: [],
    bootstrap: [AppComponent],
})
export class AppModule {}
