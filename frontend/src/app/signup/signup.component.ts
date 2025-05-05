import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router} from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.css'
})
export class SignupComponent {
  username: string = '';
  email: string = '';
  password: string = '';
  confirmPassword: string = '';

  constructor(private http: HttpClient, private router: Router) {}

  onSubmit() {
    if (this.password !== this.confirmPassword) {
      alert('Passwords do not match!');
      return;
    }

    const newUser = {
      nome: this.username,
      email: this.email,
      password: this.password
    };

    this.http.post('http://localhost:3000/api/usuarios', newUser).subscribe({
      next: (response) => {
        console.log('User created successfully:', response);
        alert('User created successfully!');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.error('Error creating user:', error);
        alert('Failed to create user.');
      }
    });    
  }
}
