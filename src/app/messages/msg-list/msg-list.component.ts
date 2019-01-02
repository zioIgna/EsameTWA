import { UsersService } from './../../users/users.service';
import { Component, OnInit, Input, OnDestroy } from '@angular/core';
import { Message } from '../message.model';
import { MessagesService } from '../messages.service';
import { Subscription, empty } from 'rxjs';

@Component({
    selector: 'app-msg-list',
    templateUrl: './msg-list.component.html',
    styleUrls: ['./msg-list.component.css']
})
export class MsgListComponent implements OnInit, OnDestroy {

    messages: Message[] = [];
    msgSub: Subscription;
    loggedEmail: string;
    loggedEmailListenerSub: Subscription; // non usata?
    soloAutori: string[] = [];
    sortedMsgs: {}; // messaggi raggruppati per autori in array (array di array) a indici letterali (email)
    myMsgs: Message[] = [];
    otherMsgs: any[] = [];
    finalMsgs: any[] = [];

    constructor(public msgService: MessagesService, public usersService: UsersService) { }

    getAuthors(msgs) {
        for (const msg of msgs) {
            if (!(this.soloAutori.includes(msg.autore))) {
                this.soloAutori.push(msg.autore);
            }
        }
    }

    // funzione non usata (?):
    alloca(msgs: Message[], autori: string[]) { // raggruppa i messaggi per autori (in un oggetto di array)
        const conversazioni = {};
        for (const header of autori) {
            conversazioni[header] = [];
            console.log('inizializzo conversazioni[header]');
            console.log(conversazioni[header]);
            for (const msg of msgs) {
                if (msg.autore === header) {
                    conversazioni[header].push(msg);
                    console.log(msg);
                    console.log(conversazioni[header]);
                    console.log('aggiunto: ' + msg + ' a ' + conversazioni[header]);
                }
            }
        }
        return conversazioni;
    }

    groupBy(objectArray, property) {
        return objectArray.reduce(function (acc, obj) {
            const key = obj[property];
            if (!acc[key]) {
                acc[key] = [];
            }
            acc[key].push(obj);
            return acc;
        }, {});
    }

    // funzione non usata (?):
    getMyMsgs(autore: string) {     // porre: myMsgs = getMsgs(...) per popolare tale array con i messaggi del soggetto loggato
        return { ...this.sortedMsgs[autore] };
    }

    // funzione non usata (?):
    spartisci3(myMsgs, otherMsgs) {   // per spostare i myMsgs negli array con i relativi destinatari
        for (let i = 0; i < myMsgs.length; i++) {
            for (let j = 0; j < otherMsgs.length; j++) {
                if (myMsgs[i].destinatario === otherMsgs[j][0].autore) {
                    otherMsgs[j].push(myMsgs[i]);
                    myMsgs.splice(i, 1);
                    i--;
                }
            }
        }
        if (myMsgs.length > 0) {
            for (let i = 0; i < myMsgs.length; i++) {
                const newArr = [];
                newArr.push(myMsgs[i]);
                otherMsgs.push(newArr);
                myMsgs.splice(i, 1);
                i--;
            }
        }
    }

    // funzione non usata (?):
    spartisci4(myMsgs, otherMsgs) {   // per spostare i myMsgs negli array con i relativi destinatari
        const newMsgs = JSON.parse(JSON.stringify(otherMsgs));
        console.log('questi sono i newMsgs: ', newMsgs);
        for (let i = 0; i < myMsgs.length; i++) {
            for (let j = 0; j < otherMsgs.length; j++) {
                if (myMsgs[i].destinatario === otherMsgs[j][0].autore) {
                    newMsgs[j].push(myMsgs[i]);
                    myMsgs.splice(i, 1);
                    i--;
                }
            }
        }
        if (myMsgs.length > 0) {
            for (let i = 0; i < myMsgs.length; i++) {
                const newArr = [];
                newArr.push(myMsgs[i]);
                otherMsgs.push(newArr);
                myMsgs.splice(i, 1);
                i--;
            }
        }
        return newMsgs;
    }

    spartisci(sortedMsgs) {
        if (sortedMsgs[this.loggedEmail]) {
            sortedMsgs[this.loggedEmail].forEach(msg => {
                if (!sortedMsgs[msg.destinatario]) {
                    sortedMsgs[msg.destinatario] = [];
                }
                sortedMsgs[msg.destinatario].push(msg);
            });
            delete sortedMsgs[this.loggedEmail];
        }
        const allKeys = Object.keys(sortedMsgs);
        const newMsgs = [];
        for (const prop of allKeys) {
            sortedMsgs[prop].sort(function (a, b) {
                return (+new Date(a.timeStamp) - (+new Date(b.timeStamp))) * (-1);
            });
            newMsgs.push(sortedMsgs[prop]);
        }
        return newMsgs;
    }

    sortMessages() {
        this.getAuthors(this.messages);
        console.log('ho ottenuto gli autori: ', this.soloAutori);
        this.sortedMsgs = this.groupBy(this.messages, 'autore');
        this.otherMsgs = Object.keys(this.sortedMsgs)
            .filter(key => key !== this.loggedEmail)
            .reduce((obj, key) => {
                return [...obj,
                obj[key] = this.sortedMsgs[key]];
            }, []);
        console.log('questi sono gli otherMsgs: ', this.otherMsgs);
        this.finalMsgs = this.spartisci(this.sortedMsgs);
        console.log('ora questi sono i sortedMsgs: ', this.finalMsgs);
    }

    ngOnInit() {
        this.loggedEmail = this.usersService.getLoggedEmail();
        this.msgService.getMessages(this.loggedEmail);

        this.msgSub = this.msgService.getMessagesUpdatedListener()
            .subscribe((fetchedMessages: Message[]) => {
                this.messages = fetchedMessages;
                this.sortMessages();
            });
    }

    ngOnDestroy() {
        this.msgSub.unsubscribe();
    }

}
