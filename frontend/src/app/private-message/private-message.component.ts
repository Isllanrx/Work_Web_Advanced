import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnDestroy, OnInit, ViewChild, ElementRef, AfterViewInit, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../services/auth.service';
import { LocalStorageService } from '../services/local-storage.service';

interface MessageUser {
  _id: string;
  nome: string;
  imagem: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  user: MessageUser;
  isEditing?: boolean;
  editedContent?: string;
  type: 'message' | 'alert' | 'info';
  destination: string;
}

interface User {
  _id: string;
  nome: string;
  email: string;
  imagem: string;
  token: string;
}

@Component({
  selector: 'app-private-message',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './private-message.component.html',
  styleUrl: './private-message.component.css'
})
export class PrivateMessageComponent implements OnInit, OnDestroy, AfterViewInit {
  messages: Message[] = [];
  users: User[] = [];
  selectedUser: User | null = null;
  newMessage: string = '';
  currentUser: User | null = null;
  userCache: { [key: string]: MessageUser } = {};
  private userSubscription?: Subscription;
  private apiUrl = 'http://localhost:3000';
  @ViewChild('messageList') messageListRef!: ElementRef;
  isLoading: boolean = false;

  constructor(
    private router: Router,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private http: HttpClient,
    private cdRef: ChangeDetectorRef
  ) { }

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.loadUsers();
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    this.scrollToBottom();
  }

  private scrollToBottom() {
    setTimeout(() => {
      if (this.messageListRef && this.messageListRef.nativeElement) {
        this.messageListRef.nativeElement.scrollTop = this.messageListRef.nativeElement.scrollHeight;
      }
    }, 100);
  }

  loadUsers() {
    this.http.get(`${this.apiUrl}/api/usuarios`, {
      headers: this.authService.getAuthHeaders()
    }).subscribe({
      next: (response: any) => {
        this.users = response.filter((user: User) => user._id !== this.currentUser?._id);
      },
      error: (error) => {
        console.error('Error loading users:', error);
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        } else {
          alert('Erro ao carregar lista de usuários');
        }
      }
    });
  }

  selectUser(user: User) {
    this.selectedUser = user;
    this.loadMessages(true);
  }

  async loadMessages(showLoading: boolean = false) {
    if (!this.selectedUser) return;
    this.isLoading = true;
    this.http.get(`${this.apiUrl}/api/mensagens/private/${this.selectedUser._id}`, {
      headers: this.authService.getAuthHeaders()
    })
      .subscribe({
        next: async (response: any) => {
          const messagesPromises = response.map(async (msg: any) => {
            let user = this.userCache[msg.autorId];
            if (!user) {
              try {
                const userData: any = await this.http.get(`${this.apiUrl}/api/usuarios/${msg.autorId}`, {
                  headers: this.authService.getAuthHeaders()
                }).toPromise();
                user = {
                  _id: userData._id,
                  nome: userData.nome,
                  imagem: userData.imagem || '/images/padrao.png'
                };
                this.userCache[msg.autorId] = user;
              } catch (error) {
                console.error('Error loading user:', error);
                user = {
                  _id: msg.autorId,
                  nome: 'Usuário',
                  imagem: '/images/padrao.png'
                };
              }
            }
            return {
              id: msg._id,
              content: msg.content,
              timestamp: new Date(msg.createdAt || msg.timestamp),
              user: user,
              type: msg.type || 'message',
              destination: msg.destination
            };
          });
          const allMessages = await Promise.all(messagesPromises);
          this.messages = allMessages.filter(m => m.content && m.content.trim() !== '');
          this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
          this.scrollToBottom();
          this.cdRef.detectChanges();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          if (error.status === 401) {
            this.authService.logout();
          }
          alert('Erro ao carregar mensagens');
          this.isLoading = false;
        }
      });
  }

  getImageUrl(imagePath: string): string {
    if (!imagePath) {
      return `${this.apiUrl}/images/padrao.png`;
    }
    const cleanPath = imagePath.replace(/^\/+/, '');
    return `${this.apiUrl}/${cleanPath}`;
  }

  onImageError(event: Event) {
    (event.target as HTMLImageElement).src = `${this.apiUrl}/images/padrao.png`;
  }

  sendMessage() {
    if (this.newMessage.trim() && this.currentUser?._id && this.selectedUser?._id) {
      const messageData = {
        texto: this.newMessage,
        autorId: this.currentUser._id,
        type: 'message',
        destination: this.selectedUser._id
      };

      this.http.post(`${this.apiUrl}/api/mensagens`, messageData, {
        headers: this.authService.getAuthHeaders()
      })
        .subscribe({
          next: (response: any) => {
            const newMessage = {
              id: response._id,
              content: response.content,
              timestamp: new Date(response.createdAt || response.timestamp),
              user: {
                _id: this.currentUser!._id,
                nome: this.currentUser!.nome,
                imagem: this.currentUser!.imagem || '/images/padrao.png'
              },
              type: response.type || 'message',
              destination: response.destination
            };
            this.messages.push(newMessage);
            this.messages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
            this.newMessage = '';
            this.scrollToBottom();
          },
          error: (error) => {
            console.error('Error sending message:', error);
            if (error.status === 401) {
              this.authService.logout();
            }
            alert('Erro ao enviar mensagem');
          }
        });
    }
  }

  goBack() {
    if (!this.selectedUser) {
      this.router.navigate(['/messages']);
      return;
    }
    this.selectedUser = null;
    this.messages = [];
    this.newMessage = '';
  }
} 