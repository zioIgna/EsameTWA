import { Component, OnInit, OnDestroy } from '@angular/core';
import { User } from '../user.model';
import { UsersService } from '../users.service';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-users-list',
    templateUrl: './users-list.component.html',
    styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit, OnDestroy {

    users: User[] = [];
    usersSub: Subscription;
    isAdmin = false;
    private adminSub: Subscription;
    loggedUserId: string;
    private loggedUserIdSub: Subscription;
    loggedUserEmail: string;
    private loggedEmailSub: Subscription;

    constructor(private usersService: UsersService) { }

    ngOnInit() {
        this.usersService.getUsers();
        this.usersSub = this.usersService.getUsersUpdatedListener().subscribe(fetchedUsers => {
            this.users = fetchedUsers;
        });
        this.isAdmin = this.usersService.getIsAdmin();
        this.adminSub = this.usersService.getAdminStatusListener().subscribe(hasAdminRole => {
            this.isAdmin = hasAdminRole;
            console.log('ho ricevuto il nuovo ruolo', hasAdminRole);
        });
        this.loggedUserId = this.usersService.getLoggedId();
        this.loggedUserIdSub = this.usersService.getLoggedUserIdListener().subscribe(loggedId => {
            this.loggedUserId = loggedId;
        });
        this.loggedUserEmail = this.usersService.getLoggedEmail();
        this.loggedEmailSub = this.usersService.getLoggedEmailListener().subscribe(loggedUser => {
            this.loggedUserEmail = loggedUser;
        });

    }

    onDelete(userId) {
        this.usersService.deleteUser(userId);
    }

    onSwitch(userId, role) {
        role === 'admin' ? role = 'basic' : role = 'admin';
        this.usersService.switchRole(userId, role);
    }

    ngOnDestroy() {
        this.usersSub.unsubscribe();
        this.adminSub.unsubscribe();
        this.loggedUserIdSub.unsubscribe();
        this.loggedEmailSub.unsubscribe();
    }

}
