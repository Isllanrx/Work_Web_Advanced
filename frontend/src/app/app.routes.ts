import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { MessageComponent } from './message/message.component';
import { PrivateMessageComponent } from './private-message/private-message.component';
import { authGuard } from './guards/auth.guard';
import { SignupComponent } from './signup/signup.component';

export const routes: Routes = [
  { path: '', redirectTo: '/messages', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'messages', component: MessageComponent, canActivate: [authGuard] },
  { path: 'private-messages', component: PrivateMessageComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: '/messages' }
];
