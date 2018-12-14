import { Component, OnInit, OnDestroy } from '@angular/core';
import { Message } from './message';
import { AppComponentService } from './app.component.service';
import * as moment from 'moment';
import { HostListener } from '@angular/core';
import { some } from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})

export class AppComponent implements OnInit, OnDestroy {
  @HostListener('document:keypress', ['$event'])
  handleDeleteKeyboardEvent(event: KeyboardEvent) {
    if (event.key === 'Enter') {
      if (this.isLoggedIn)
        this.send();
      else
        this.login();
    }
  }
  title = 'graphql-chat-client';
  isLoggedIn: boolean;
  userName: string;
  password: string;
  onlineUsers: any[] = [];
  loginError: string
  toUserName: string = null;
  messageStore: Map<string, Message[]> = new Map<string, Message[]>();
  subscriptionTracker: Map<string, Boolean> = new Map<string, Boolean>();
  inputMessage: string = null;
  subscriptionHandles: Array<ZenObservable.Subscription> = []

  constructor(private appComponentService: AppComponentService) {
  }

  ngOnInit(): void {

  }

  ngOnDestroy(){
    this.resetState();
  }

  resetState(): void{
    this.isLoggedIn = false;
    this.userName = null;
    this.password = null;
    this.loginError = null;
    this.toUserName = null;
    this.onlineUsers = [];
    this.messageStore = new Map<string, Message[]>();
    this.subscriptionTracker = new Map<string, Boolean>();
    this.inputMessage = null;
    this.subscriptionHandles.forEach(handle => handle.unsubscribe());
    this.subscriptionHandles = [];
  }

  logout(): void{
    this.resetState();
  }

  selectUser(user): void {
    this.toUserName = user.name;
    this.onlineUsers.forEach(u => {
      u.isActive = u.name === this.toUserName;
      if (u.name === user.name)
        u.showNotification = false;
    });
  }

  send(): void {
    if (!this.inputMessage || this.inputMessage === '')
      return;
    const msg = new Message();
    msg.content = this.inputMessage;
    msg.from = this.userName;
    msg.to = this.toUserName;
    msg.dateTime = moment().format('h:mm A | MMM D');
    this.appComponentService.sendMessage(msg)
      .subscribe(res => {
        if (!res.data)
          console.log(res.errors);
      })
    this.inputMessage = null;
  }

  isAnyOtherUserOnline(): boolean{
    return (this.onlineUsers && some(this.onlineUsers, u => u.name !== this.userName));
  }

  login(): void {
    this.loginError = null;
    if (!this.userName || !this.password) {
      this.loginError = 'user name/password is mandatory'
      return;
    }

    const handle = this.appComponentService.onlineUsers()
      .subscribe(response => {
        if (response.data && response.data.onlineUsers)
          this.setOnlineUsers(response.data.onlineUsers, true);
      })
    this.subscriptionHandles.push(handle);

    this.appComponentService.addUser(this.userName, this.password)
      .subscribe(response => {
        if (response.data && response.data.addUser) {
          this.setOnlineUsers(response.data.addUser, true);
          this.isLoggedIn = true;
        }
        else if(response.errors && response.errors.length > 0){
          console.log(response);
          this.loginError = response.errors[0].message;
        }
        else{
          console.log(response);
        }
      })
  }

  initializeMessageSubscriptions() {
    this.onlineUsers.forEach(u => {
      if (!this.subscriptionTracker.has(u.name) && u.name !== this.userName) {
        const handle = this.appComponentService.receiveMessage(this.userName, u.name)
          .subscribe(response => {
            const messages = this.messageStore.get(u.name) || [];
            if (response && response.data && response.data.receiveMessage) {
              const receiveMessage = response.data.receiveMessage;
              receiveMessage.receivedMessage.forEach(message => {
                messages.push(message);
                this.messageStore.set(u.name, messages);
              });
              if (!receiveMessage.initialPush ||
                (receiveMessage.initialPush && receiveMessage.receivedMessage.length > 0)) {
                this.setSentMessageNotification(receiveMessage.receivedMessage[0].from);
              }
            }
            else if (response.errors) {
              console.log(response.errors);
            }
          });
        this.subscriptionHandles.push(handle);
        this.subscriptionTracker.set(u.name, true);
      }
    });
  }

  setSentMessageNotification(fromUserName) {
    this.onlineUsers.forEach(u => {
      if (u.name === fromUserName)
        u.showNotification = true;
    })
  }

  getCssClassForUser(user): string {
    let className = 'chat_list';
    if (user.isActive)
      className += ' active_chat';
    if (user.showNotification)
      className += ' messageNotification';
    return className;
  }

  setOnlineUsers(users, initializeMessageSubscription): void {
    if (!users) return;
    this.onlineUsers = [];
    users.forEach(u => {
      const isActive = u === this.toUserName;
      this.onlineUsers.push({ name: u, isActive });
    });

    //If the user whom I was chatting with went offline, handle it below
    // if(!some(users, u => u === this.toUserName))
    //   this.toUserName = null;

    if(initializeMessageSubscription)
      this.initializeMessageSubscriptions();
  }
}
