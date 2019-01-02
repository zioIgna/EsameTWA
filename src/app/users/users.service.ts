import { environment } from './../../environments/environment';
import { Router } from '@angular/router';
import { ConnectionService } from '../connection.service';
import { User } from './user.model';
import { Injectable, OnInit } from '@angular/core';
import { Subject } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { AuthData } from './auth-data.model';
import { GamesService } from '../games/games.service';
import { map } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class UsersService implements OnInit {

    private users: User[] = [];
    private usersUpdated = new Subject<User[]>();
    private token: string;
    private authStatusListener = new Subject<boolean>();
    private isAdmin = false;
    private adminStatusListener = new Subject<boolean>();
    private loggedUserId: string;
    private loggedUserIdListener = new Subject<string>();
    private loggedEmail: string;
    private loggedEmailListener = new Subject<string>();
    private tokenTimer: any;
    private connectionId: string;
    loggedEmails: string[] = [];  // memorizzo la mail degli utenti attualmente on-line
    private loggedEmailsListener = new Subject<string[]>();
    activePlayers = [];
    private activePlayersListener = new Subject<string[]>();
    games = [];
    private gamesListener = new Subject<string[]>();
    private alreadyWaitingListener = new Subject<boolean>();

    constructor(
      private connessione: ConnectionService,
      private http: HttpClient,
      private router: Router,
    ) { }

    getConnessione() {
      return this.connessione;
    }

    getToken() {
        return this.token;
    }

    getAuthStatusListener() {
        return this.authStatusListener.asObservable();
    }

    getIsAdmin() {
        return this.isAdmin;
    }

    getAdminStatusListener() {
        return this.adminStatusListener.asObservable();
    }

    getLoggedId() {
        return this.loggedUserId;
    }

    getLoggedUserIdListener() {
        return this.loggedUserIdListener.asObservable();
    }

    getLoggedEmail() {
        return this.loggedEmail;
    }

    getLoggedEmailListener() {
        return this.loggedEmailListener.asObservable();
    }

    getLoggedEmailsPluralListener() {
      return this.loggedEmailsListener.asObservable();
    }

    sendLoggedEmailsPluralListener(loggedEmails: string[]) {
      this.loggedEmailsListener.next(loggedEmails);
    }

    getConnectionId() {
        return this.connectionId;
    }

    getLocalUsers() {
      return this.users;
    }

    getUsers() {
        this.http.get<{ note: string, users: any }>('http://localhost:3000/api/users')
        // aggiunta la pipe per trasformare gli oggetti restituiti secondo il modello
        // di User del frontend, mantendoli observable:
            .pipe(map((usersData) => {
              return {
                note: usersData.note,
                users: usersData.users.map(user => {
                  return {
                    _id: user._id,
                    email: user.email,
                    password: '',
                    ruolo: user.role,
                    score: user.score,
                    battlesCount: user.battlesCount
                  };
                })
              };
            }))
            .subscribe((usersData) => {
                console.log(usersData.note);
                console.log('questi sono i nuovi users', usersData.users);
                this.users = usersData.users;
                this.usersUpdated.next([...this.users]);
            });
    }

    returnUsersEmails(): Promise<string[]> {  // invocata da login() per verificare se utente già loggato
      const promise = new Promise<string[]>((resolve, reject) => {
        this.http.get<{ note: string, users: any }>('http://localhost:3000/api/loggedUsers')
          .toPromise()
          .then(
            res => {
              let myUsersEmails: string[];
              myUsersEmails = res.users.map(user => {
                const email = user.email;
                return email; // così ritorno un array di stringhe (email), non un array di oggetti json
              });
              resolve(myUsersEmails);
            },
            msg => {
              reject(msg);
            }
          );
      });
      return promise;
    }

    getUsersUpdatedListener() {
        return this.usersUpdated.asObservable();
    }

    sendActivePlayers( activePlayers ) {
      this.activePlayersListener.next(activePlayers);
    }

    getActivePlayersListener() {
      return this.activePlayersListener.asObservable();
    }

    sendGames(games) {
      this.gamesListener.next(games);
    }

    getGamesListener() {
      return this.gamesListener.asObservable();
    }

    sendAlreadyWaiting(value) {
      this.alreadyWaitingListener.next(value);
    }

    getAlreadyWaitingListener() {
      return this.alreadyWaitingListener.asObservable();
    }

    createUser(email: string, password: string) {
        const authData: AuthData = {
            email: email,
            password: password,
        };
        console.log(this.users);
        this.http.post<{ note: string, datiSalvati: any, token: string }>('http://localhost:3000/api/users/signup', authData)
            .subscribe((responseData) => {
                console.log(responseData.note);
                console.log('questi sono i savedData: ', responseData.datiSalvati);
                this.connessione.socket.emit('new user', { message: 'nuovo utente registrato', payload: authData });
                this.login(email, password);
            }, (err) => {
                console.log(err);
            });
    }

    login(email: string, password: string) {
      const usersEmailsPromise = this.returnUsersEmails();
      usersEmailsPromise.then((data) => {
        if (!data.includes(email)) {
          const authData: AuthData = {
                email: email,
                password: password
          };
          this.http.post<{
              token: string, expiresIn: number, userRole: string, userId: string,
              email: string, activePlayers: string[], games: string[]
          }>('http://localhost:3000/api/users/login', authData)
              .subscribe(response => {
                  const token = response.token;
                  this.token = token;
                  if (token) {
                      const expiresInDuration = response.expiresIn;
                      this.tokenTimer = setTimeout(() => {
                          this.logout();
                      }, expiresInDuration * 1000);
                      // si passa l'info se il soggetto loggato è amministratore o no
                      this.isAdmin = (response.userRole === 'admin');
                      this.adminStatusListener.next(this.isAdmin);    // forse non serve la sottoscriz
                      this.loggedUserId = response.userId;
                      this.loggedUserIdListener.next(this.loggedUserId);
                      console.log('questo è lo id loggato', this.loggedUserId);
                      this.loggedEmail = response.email;
                      this.loggedEmailListener.next(this.loggedEmail);
                      this.authStatusListener.next(true);  // questo comando serve solo all'header
                      this.router.navigate(['/overview']);
                      this.connectionId = this.connessione.socket.id;
                      const datiConnessione = { email: this.loggedEmail, connectionId: this.connectionId};
                      this.connessione.socket.emit('logged user', datiConnessione);
                      this.activePlayers = response.activePlayers;
                      this.sendActivePlayers(response.activePlayers);
                      this.games = response.games;
                      this.sendGames(response.games);
                  }
              }, (err) => {
                alert('Credenziali non valide');
                console.log('Error: user could not login ', err);
              });
          } else {
            alert('L\'utente è già loggato');
          }

      });
    }

    logout() {
        // authStatusListener serve solo all'header per sapere che bottoni mostrare
        const datiConnessione = { email: this.loggedEmail, connectionId: this.connectionId};
        this.token = null;
        this.isAdmin = false;
        this.loggedUserId = null;
        this.loggedEmail = null;
        this.authStatusListener.next(false);
        clearTimeout(this.tokenTimer);
        this.connessione.socket.emit('user loggedOut', datiConnessione);
        console.log('questi sono i dati connessione che invio al logout: ' + JSON.stringify(datiConnessione));
        this.router.navigate(['/']);
    }

    abandonBattle (myMail) {
      this.connessione.socket.emit('abandoned battle', myMail);
    }

    deleteUser(userId: string) {
        this.http.delete('http://localhost:3000/api/users/delete/' + userId).subscribe((response) => {
            console.log('Msg frontend: user deleted, backend: ', response);
            this.connessione.socket.emit('deleted user', { message: 'utente eliminato' });
            if (this.loggedUserId === userId) {
                this.logout();
            }
        }, (err) => {
            console.log('Error: user not deleted ', err);
        });
    }

    switchRole(userId: string, role: string) {
        console.log('questo è il role passato: ', role);
        const newSetting = {
            role: role
        };
        this.http.put<{
            msg: string,
            outcome: object
        }>('http://localhost:3000/api/users/switch/' + userId, newSetting)
            .subscribe(
                (response) => {
                    console.log('Msg frontend: user\'s role switched', response);
                    this.connessione.socket.emit('user updated', { message: 'user\'s role switched' });
                },
                (err) => {
                    console.log('Error: user\'s role not switched', err);
                }
            );
    }


    ngOnInit() {
        this.connessione.getConnection();
    }

}
