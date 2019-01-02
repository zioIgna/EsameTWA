import { Injectable } from '@angular/core';
import * as socketIo from 'socket.io-client';
import { Subject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class ConnectionService {
    socket = null;
    binaryId = -1;

    // da qui inserito per prova di trasmissione id connessione
    private subject = new Subject<any>();

    sendId(id: any) {
        this.subject.next({ myId: id });
    }

    getId(): Observable<any> {
        return this.subject.asObservable();
    }
    // a qui

    getConnection() {
        if (this.socket === null) {
            this.socket = socketIo('http://localhost:3000');
        }
    }


}
