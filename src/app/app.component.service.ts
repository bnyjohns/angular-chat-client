import { Injectable } from "@angular/core";
import { Apollo } from 'apollo-angular';
import { ApolloQueryResult } from 'apollo-client';
import { split, createOperation, execute, Observable } from 'apollo-link';
import { HttpLink } from 'apollo-angular-link-http';
import { WebSocketLink } from 'apollo-link-ws';
import { SubscriptionClient } from 'subscriptions-transport-ws';
import gql from 'graphql-tag';
import { environment } from '../environments/environment';


@Injectable({
  providedIn: 'root'
})

export class AppComponentService{
  wsLink: WebSocketLink;
  constructor(){
    const wsUrl = environment.serverUrl;
    const subsciptionClient = new SubscriptionClient(wsUrl,
    {
        reconnect: false,
        connectionParams: {
            authorization: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJqdGkiOiJmYjYzZWZmYy00Nzc4LTQ3MDEtYTZiOS05ZGUwMWY3MDQ1MWIiLCJ2ZXIiOiIxLjAiLCJzY29wZSI6InRlc3Q6ZGV2aWNlcyIsImlhdCI6MTU0MzU5Mjk3MCwiZXhwIjoxNTQzNTk2NTcwLCJhdWQiOiJiMDg2ZjJjMC00MjVjLTQ0ZWMtODhlNi01OWIwYmRkZmI0MTAiLCJpc3MiOiJzYW5kYm94LmFjY291bnRzLmxvZ2kuY29tIiwic3ViIjoiMjU3ZDk5MWQtZGRkYS00YzBkLThhMTUtNjhmMDAzMzY3NjgxIn0.ZLKQXoUf-MPr8lwAhP1pgnY8ynnxbfbKb0Pn_78PC6bOljoyGjumyuthLjgCkZhSrhEuvudRqm4zsRrR1PrJFYQtJdfvI4b_bfFtZktwcs9ROjHM-tOnQUK_itco3q6llTrJofDiuxvdTsZ3O0VOvs2-nKlOsCeL3TIzollFQ9xZwvD-DiOz79FrAUu4wmlEFgCGYQUb9sFQSTL-T0RKW6SGd6bXlSTkOHiRWnSw6tzD_pzdYTGsNvQGH-ejIRxkzQAs9z4YbY9qtXlSPok5MZInZxUG30pXvpNC_-3V7quk47TzN4ZDVBqqGfDWEiM7n1wb-2TU0LPNL4A-y1XnK9y_2rWssfBiuEfiRv5Pquuu8mRlP540TFCPT8cANmAt3SV4YRVv1OxiaYKoCkyckDeNew296aywGuklXckWvB0YPedlD_Ja7MwYSy-Wpepoo53nKFfRbwquC5uyLzRs7TtyyrtdSGzTg7rqjwJyGiYLT74eLvMfoEW5DId0njuBYOevj6pSjbhEDicL0DCmrw4HQaun_BwUeJNFD3LkybZIzaS9Qui2RDIT84WFSWINAy8dcnzpj4eGoCixssqzM9gftGnRLniTn0gZMa-IJ8uglgYH_rWvvrA6eThZCPztuMK7FS8trpa9M4DVCjqrQxujNXhsbqj0voBFCsFdoiU"
        },
    });
    subsciptionClient.onError(error => console.log(error));
    this.wsLink = new WebSocketLink(subsciptionClient);
  }

  getUsers(): Observable<any>{
    return execute(this.wsLink, {
      query: gql`query getUsers{
        getUsers
      }`
    })
  }

  onlineUsers(): Observable<any>{
    return execute(this.wsLink, {
      query: gql`subscription onlineUsers{
        onlineUsers
      }`
    })
  }

  receiveMessage(from, to): Observable<any>{
    return execute(this.wsLink, {
      query: gql`subscription receiveMessage($from: String!, $to: String!){
        receiveMessage(from: $from, to: $to){
          initialPush
          receivedMessage{
                from
                to
                content
                dateTime
          }
        }
      }`,
      variables: {
        from,
        to,
      }
    })
  }

  addUser(userName, password): Observable<any>{
    return execute(this.wsLink, {
      query: gql`mutation addUser($user: UserInput!){
        addUser(user: $user)
      }`,
      variables: {
        user: {
          id: userName,
          password
        }
      }
    })
  }

  removeUser(userName): Observable<any>{
    return execute(this.wsLink, {
      query: gql`mutation removeUser($user: String!){
        removeUser(user: $user)
      }`,
      variables: {
        user: userName
      }
    })
  }

  sendMessage(message): Observable<any>{
    return execute(this.wsLink, {
      query: gql`mutation sendMessage($message: Message!){
        sendMessage(message: $message)
      }`,
      variables: {
        message: message
      }
    })
  }
}
