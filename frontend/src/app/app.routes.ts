import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MessageComponent } from './message/message.component';
import { authGuard } from './middlewares/auth.middleware';
import { SignupComponent } from './signup/signup.component';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'message', component: MessageComponent, canActivate: [authGuard] }
];
