import { Component, OnInit, OnDestroy } from '@angular/core';
import { UsersService } from '../users/users.service';
import { Subscription } from '../../../node_modules/rxjs';
import { Router } from '@angular/router';
import { BattleService } from '../games/battle/battle.service';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit, OnDestroy {

  // questi 2 metodi servono solo all'header per sapere quali pulsanti mostrare
  userIsAuthenticated = false;
  private authListenerSubs: Subscription;
  myBattle;
  myBattleSub: Subscription;

  constructor(private usersService: UsersService, private router: Router, private battleService: BattleService) { }

  ngOnInit() {
    this.authListenerSubs = this.usersService.getAuthStatusListener().subscribe((isAuthenticated) => {
      this.userIsAuthenticated = isAuthenticated;
    });
    this.myBattle = this.battleService.myBattle;
    this.myBattleSub = this.battleService.getMyBattleListener().subscribe(newBattle => this.myBattle = newBattle);
  }

  onOverview() {
    if (this.battleService.myBattle.length > 0) {
      this.usersService.getConnessione().socket.emit('back to overview');
    }
    this.router.navigate(['/overview']);
  }

  onGames() {
    if (this.battleService.myBattle.length > 0) {
      this.usersService.getConnessione().socket.emit('back to overview');
    }
    this.router.navigate(['/games']);
  }

  onLogout() {
    this.usersService.logout();
  }

  ngOnDestroy() {
    this.authListenerSubs.unsubscribe();
    this.myBattleSub.unsubscribe();
  }

}
