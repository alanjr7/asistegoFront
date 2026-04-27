import { bootstrapApplication } from '@angular/platform-browser';
import { AppComponent } from './app/app.component';
import { provideAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './app/interceptors/auth.interceptor';
import { LOCALE_ID, importProvidersFrom } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localeEsBo from '@angular/common/locales/es-BO';

registerLocaleData(localeEsBo);

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    provideHttpClient(withInterceptors([authInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-BO' }
  ]
}).catch(err => console.error(err));
