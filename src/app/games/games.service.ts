import { UsersService } from './../users/users.service';
import { Injectable, OnInit, OnDestroy } from '@angular/core';
import { ConnectionService } from '../connection.service';
import { Subscription, Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class GamesService implements OnInit, OnDestroy {

  games: string[] = [];  // ['Player1', 'Player2', 'Player3', 'ignaziocarbonaro@hotmail.com'];
  private gamesSub: Subscription;
  activePlayers: string[];
  private activePlayersSub: Subscription;

  constructor(private usersService: UsersService, private connessione: ConnectionService) { }

  createGame() {
    const myMail = this.usersService.getLoggedEmail();
    if (!this.games.includes(myMail)) {
      // this.games.push(myMail); // meglio fare l'update dell'array quando si riceve il segnale dal server
      this.usersService.sendAlreadyWaiting(true);
      this.connessione.socket.emit('new game', myMail);
      console.log('lancio un nuovo game con questa mail: ' + myMail);
    }
  }

  ngOnInit() {
    this.activePlayers = this.usersService.activePlayers;
    // serve questa sottoscrizione?:
    this.activePlayersSub = this.usersService.getActivePlayersListener()
      .subscribe(newActivePlayers => this.activePlayers = newActivePlayers);
    this.games = this.usersService.games;
    // serve questa sottoscrizione?:
    this.gamesSub = this.usersService.getGamesListener().subscribe(newGames => this.games = newGames);
  }

  ngOnDestroy() {
    this.gamesSub.unsubscribe();
    this.activePlayersSub.unsubscribe();
  }

}
