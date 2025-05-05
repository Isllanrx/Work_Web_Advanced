import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email: string = '';
  senha: string = '';
  error: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  onSubmit() {
    this.authService.login(this.email, this.senha)
      .subscribe({
        next: () => {
          this.router.navigate(['/message']);
        },
        error: (error) => {
          this.error = 'Email ou senha inválidos';
          console.error('Login error:', error);
        }
      });
  }
}
