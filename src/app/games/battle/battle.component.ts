import { Component, OnInit, OnDestroy } from '@angular/core';
import { BoardComponent } from './board/board.component';
import { PlayerComponent } from './player/player.component';
import { BattleService } from './battle.service';
import { Subscription } from 'rxjs';
import { ConnectionService } from 'src/app/connection.service';

@Component({
  selector: 'app-battle',
  templateUrl: './battle.component.html',
  styleUrls: ['./battle.component.css']
})
export class BattleComponent implements OnInit, OnDestroy {

  boards: BoardComponent[] = [];
  boardsSub: Subscription;
  binaryId: number;
  binaryIdSub: Subscription;
  currPlayer: number;
  currPlayerSub: Subscription;
  endGame: boolean;
  endGameSub: Subscription;
  orientation: string;
  orientationSub: Subscription;
  playerDisconnected: boolean;
  playerDisconnectedSub: Subscription;
  positionedShips: number;
  positionedShipsSub: Subscription;
  stringifiedBinaryId: string;

  constructor(private battleService: BattleService, private connectionService: ConnectionService) {}

  ngOnInit() {
    this.boards = this.battleService.getBoards();
    this.boardsSub = this.battleService.getBoardsListener().subscribe(updatedBoards => this.boards = updatedBoards);
    this.binaryId = this.connectionService.binaryId;
    this.binaryIdSub = this.connectionService.getId().subscribe(newId => {
      this.binaryId = newId.myId;
      this.stringifiedBinaryId = JSON.stringify(this.binaryId);
    });
    this.currPlayer = this.battleService.currPlayer;
    this.currPlayerSub = this.battleService.getCurrPlayerListener().subscribe(newVal => this.currPlayer = newVal);
    this.endGame = this.battleService.endGame;
    this.endGameSub = this.battleService.getEndGameListener().subscribe( newValue => this.endGame = newValue);
    this.positionedShips = this.battleService.positionedShips;
    this.positionedShipsSub = this.battleService.getPositionedShipsListener().subscribe ( newVal => this.positionedShips = newVal);
    this.orientation = this.battleService.orientation;
    this.orientationSub = this.battleService.getOrientationListener().subscribe(newOrientation => this.orientation = newOrientation);
    this.playerDisconnected = this.battleService.playerDisconnected;
    this.playerDisconnectedSub = this.battleService.getPlayerDisconnectedListener().subscribe(newVal => this.playerDisconnected = newVal);
  }

  onGetPosition(e: any) {
    this.battleService.getPosition(e);
  }

  onGetMyBattle() {
    return this.battleService.getMyBattle();
  }

  onSetHorizontal() {
    this.battleService.setHorizontal();
  }

  onSetVertical() {
    this.battleService.setVertical();
  }

  ngOnDestroy() {
    this.boardsSub.unsubscribe();
    this.binaryIdSub.unsubscribe();
    this.currPlayerSub.unsubscribe();
    this.endGameSub.unsubscribe();
    this.orientationSub.unsubscribe();
    this.playerDisconnectedSub.unsubscribe();
    this.positionedShipsSub.unsubscribe();
  }

}
