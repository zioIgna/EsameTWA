import { ConnectionService } from './../connection.service';
import { Message } from './message.model';
import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { Subject, Observable, Subscription } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { UsersService } from '../users/users.service';

@Injectable({ providedIn: 'root' })
export class MessagesService implements OnInit, OnDestroy {
    private messages: Message[] = [];
    private messagesUpdated = new Subject<Message[]>();
    private soloAutori: string[] = [];
    private loggedEmail: string;
    private loggedEmailListener: Subscription;
    private loggedEmailListenerSub: Subscription; // non usata?

    constructor(private http: HttpClient, private usersService: UsersService, private connessione: ConnectionService) { }

    getMessages(loggedUser: string) {
        this.http.get<{ note: string, messages: Message[] }>('http://localhost:3000/api/messages/' + loggedUser)
            .subscribe((msgData) => {
                this.messages = msgData.messages;
                this.messagesUpdated.next([...this.messages]);
            }, err => {
                console.log('Recupero messaggi non riuscito', err);
            });
    }



    getMessagesUpdatedListener() {
        return this.messagesUpdated.asObservable();

    }

    addMessage(message: Message) {
        const newMessage: Message = {
            autore: message.autore,
            contenuto: message.contenuto,
            destinatario: message.destinatario,
            timeStamp: message.timeStamp
        };
        this.http.post<{ note: string, msg: object }>('http://localhost:3000/api/messages', newMessage)
            .subscribe((responseData) => {
                console.log(responseData.note);
                console.log('messaggio salvato: ', responseData.msg);
                this.connessione.socket
                    .emit('new msg', { message: 'nuovo messaggio inviato', payload: responseData.msg });  // linea aggiunta
            }, err => {
                console.log('No message sent ', err);
            });
    }

    sortMessages(messages: Message[]) {

    }

    ngOnInit() {
        this.loggedEmail = this.usersService.getLoggedEmail();
        this.loggedEmailListener = this.usersService.getLoggedEmailListener().subscribe(loggedMail => {
            this.loggedEmail = loggedMail;
        });
    }

    ngOnDestroy() {
      this.loggedEmailListener.unsubscribe();
    }
}
