import { Subscription } from 'rxjs';
import { User } from './../../users/user.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Message } from '../message.model';
import { MessagesService } from '../messages.service';
import { UsersService } from '../../users/users.service';

@Component({
    selector: 'app-message-create',
    templateUrl: './message-create.component.html',
    styleUrls: ['./message-create.component.css']
})
export class MessageCreateComponent implements OnInit, OnDestroy {
    contenuto = '';
    destinatario = '';
    users: User[] = [];
    usersSub: Subscription;
    recipients: User[] = [];
    private loggedUserId: string;
    private loggedUserIdSub: Subscription;
    private loggedEmail: string;
    private loggedEmailListener: Subscription;

    constructor(private msgService: MessagesService, private usersService: UsersService) { }

    onSend() {
        const message: Message = {
            autore: this.loggedEmail,
            contenuto: this.contenuto,
            destinatario: this.destinatario,
            timeStamp: new Date().toISOString()
        };
        this.msgService.addMessage(message);
        this.contenuto = '';
        this.destinatario = '';
    }

    ngOnInit() {
        this.loggedUserId = this.usersService.getLoggedId();
        this.loggedUserIdSub = this.usersService.getLoggedUserIdListener().subscribe(loggedId => {
            this.loggedUserId = loggedId;
        });
        this.loggedEmail = this.usersService.getLoggedEmail();
        this.loggedEmailListener = this.usersService.getLoggedEmailListener().subscribe(loggedMail => {
            this.loggedEmail = loggedMail;
        });
        this.usersService.getUsers();
        this.recipients = this.users.filter(user => user._id !== this.loggedUserId);
        this.usersSub = this.usersService.getUsersUpdatedListener().subscribe(fetchedUsers => {
            this.users = fetchedUsers;
            this.recipients = fetchedUsers.filter(user => user._id !== this.loggedUserId);
        });
    }

    ngOnDestroy() {
        this.usersSub.unsubscribe();
        this.loggedUserIdSub.unsubscribe();
        this.loggedEmailListener.unsubscribe();
    }

}
