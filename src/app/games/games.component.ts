import { Subscription } from 'rxjs';
import { GamesService } from './games.service';
import { ConnectionService } from './../connection.service';
import { UsersService } from './../users/users.service';
import { Component, OnInit, OnDestroy } from '@angular/core';


@Component({
  selector: 'app-games',
  templateUrl: './games.component.html',
  styleUrls: ['./games.component.css']
})
export class GamesComponent implements OnInit, OnDestroy {

  private loggedUserEmail: string;
  private loggedEmailSub: Subscription;
  alreadyWaiting: boolean;
  alreadyWaitingSub: Subscription;

  constructor(private gamesService: GamesService, private usersService: UsersService, private connection: ConnectionService) { }

  ngOnInit() {
    this.connection.getConnection();
    this.loggedUserEmail = this.usersService.getLoggedEmail();
    this.alreadyWaiting = this.usersService.games.includes(this.loggedUserEmail);
    console.log('Il loggedUserEmail è: ' + this.loggedUserEmail);
    this.loggedEmailSub = this.usersService.getLoggedEmailListener().subscribe(loggedUser => {
      this.loggedUserEmail = loggedUser;
      this.alreadyWaiting = this.usersService.games.includes(this.loggedUserEmail);
      console.log('Il loggedUserEmail è: ' + this.loggedUserEmail);
    });
    this.alreadyWaitingSub = this.usersService.getAlreadyWaitingListener().subscribe(value => this.alreadyWaiting = value);
  }

  onCreateGame() {
    this.gamesService.createGame();
  }

  ngOnDestroy() {
    this.loggedEmailSub.unsubscribe();
    this.alreadyWaitingSub.unsubscribe();
  }

}
