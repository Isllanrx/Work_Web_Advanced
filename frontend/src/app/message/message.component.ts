import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { interval, Subscription } from 'rxjs';
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
  destination?: string;
}

interface User {
  _id: string;
  nome: string;
  email: string;
  imagem: string;
  token: string;
}

@Component({
  selector: 'app-message',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HttpClientModule],
  templateUrl: './message.component.html',
  styleUrl: './message.component.css'
})
export class MessageComponent implements OnInit, OnDestroy {
  messages: Message[] = [];
  private editingMessage: boolean = false;
  newMessage: string = '';
  selectedMessageType: 'message' | 'alert' | 'info' = 'message';
  currentUser: User | null = null;
  private apiUrl = 'http://localhost:3000';
  userCache: { [key: string]: MessageUser } = {};
  private pollingSubscription?: Subscription;
  private userSubscription?: Subscription;

  constructor(
    private router: Router,
    private authService: AuthService,
    private localStorage: LocalStorageService,
    private http: HttpClient
  ) { }

  ngOnInit() {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/login']);
      return;
    }

    this.userSubscription = this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });

    this.loadMessages();

    // Iniciar polling a cada 3 segundos
    this.pollingSubscription = interval(3000).subscribe(() => {
      if(!this.editingMessage) {
        this.loadMessages();
      }
    });
  }

  ngOnDestroy() {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  loadMessages() {
    this.http.get(`${this.apiUrl}/api/mensagens`, {
      headers: this.authService.getAuthHeaders()
    })
      .subscribe({
        next: async (response: any) => {
          const messagesPromises = response
            .filter((msg: any) => !msg.destination) // Only show public messages
            .map(async (msg: any) => {
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
                timestamp: new Date(),
                user: user,
                type: msg.type || 'message'
              };
            });

          this.messages = await Promise.all(messagesPromises);
        },
        error: (error) => {
          console.error('Error loading messages:', error);
          if (error.status === 401) {
            this.authService.logout();
          }
          alert('Erro ao carregar mensagens');
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
    if (this.newMessage.trim() && this.currentUser?._id) {
      const messageData = {
        texto: this.newMessage,
        autorId: this.currentUser._id,
        type: this.selectedMessageType
      };

      this.http.post(`${this.apiUrl}/api/mensagens`, messageData, {
        headers: this.authService.getAuthHeaders()
      })
        .subscribe({
          next: (response: any) => {
            this.messages.push({
              id: response._id,
              content: response.texto,
              timestamp: new Date(),
              user: {
                _id: this.currentUser!._id,
                nome: this.currentUser!.nome,
                imagem: this.currentUser!.imagem || '/images/padrao.png'
              },
              type: response.type || 'message'
            });
            this.newMessage = '';
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

  goToPrivateMessages() {
    this.router.navigate(['/private-messages']);
  }

  logout() {
    this.authService.logout();
  }

  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const formData = new FormData();
      formData.append('imagem', file);

      fetch(`http://localhost:3000/api/usuarios/upload/${this.currentUser?._id}`, {
        method: 'POST',
        body: formData
      })
        .then(response => response.json())
        .then(data => {
          if (this.currentUser) {
            this.currentUser.imagem = data.imagem;
            this.localStorage.setItem('userConnected', this.currentUser);
          }
        })
        .catch(error => {
          console.error('Error uploading image:', error);
          alert('Erro ao fazer upload da imagem');
        });
    }
  }

  startEdit(message: Message) {
    this.editingMessage = true;
    message.isEditing = true;
    message.editedContent = message.content;
  }

  cancelEdit(message: Message) {
    this.editingMessage = false;
    message.isEditing = false;
    message.editedContent = undefined;
  }

  saveEdit(message: Message) {
    this.editingMessage = false;
    if (message.editedContent?.trim()) {
      this.http.put(`${this.apiUrl}/api/mensagens/${message.id}`, {
        content: message.editedContent
      }, {
        headers: this.authService.getAuthHeaders()
      }).subscribe({
        next: () => {
          message.content = message.editedContent!;
          message.isEditing = false;
          message.editedContent = undefined;
        },
        error: (error) => {
          console.error('Error updating message:', error);
          alert('Erro ao atualizar mensagem');
        }
      });
    }
  }

  deleteMessage(message: Message) {
    if (confirm('Tem certeza que deseja excluir esta mensagem?')) {
      this.http.delete(`${this.apiUrl}/api/mensagens/${message.id}`, {
        headers: this.authService.getAuthHeaders()
      })
        .subscribe({
          next: () => {
            this.messages = this.messages.filter(m => m.id !== message.id);
          },
          error: (error) => {
            console.error('Error deleting message:', error);
            alert('Erro ao excluir mensagem');
          }
        });
    }
  }
}
