import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, tap } from 'rxjs';

interface User {
  _id: string;
  nome: string;
  email: string;
  imagem: string;
  token: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private isBrowser: boolean;

  constructor(
    private http: HttpClient,
    private router: Router,
    @Inject(PLATFORM_ID) platformId: Object
  ) {
    this.isBrowser = isPlatformBrowser(platformId);
    // Recuperar usuário do localStorage ao iniciar
    if (this.isBrowser) {
      const storedUser = localStorage.getItem('userConnected');
      if (storedUser) {
        this.currentUserSubject.next(JSON.parse(storedUser));
      }
    }
  }

  login(email: string, senha: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/api/usuarios/login`, { email, password: senha })
      .pipe(
        tap((response: any) => {
          if (response.user && response.user.token) {
            this.setUser(response.user);
          }
        })
      );
  }

  private setUser(user: User) {
    if (this.isBrowser) {
      localStorage.setItem('userConnected', JSON.stringify(user));
    }
    this.currentUserSubject.next(user);
  }

  logout() {
    if (this.isBrowser) {
      localStorage.removeItem('userConnected');
    }
    this.currentUserSubject.next(null);
    this.router.navigate(['/login']);
  }

  getToken(): string | null {
    const user = this.currentUserSubject.value;
    return user?.token || null;
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    if (!token) return false;

    try {
      // Verificar se o token está expirado
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationDate = new Date(payload.exp * 1000);
      return expirationDate > new Date();
    } catch (error) {
      return false;
    }
  }

  getAuthHeaders() {
    const token = this.getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }
}
