import './common.css';
import "core-js/features/map";
import "core-js/features/set";
import React from "react";
import ReactDOM from "react-dom";
import io from 'socket.io-client';
import bridge from "@vkontakte/vk-bridge";

bridge.send("VKWebAppInit");

async function getUserData(){
  return await bridge.send('VKWebAppGetUserInfo');
  // return {
  //   "id": 281254431,
  //   "first_name": "Григорий",
  //   "last_name": "Семенов",
  //   "sex": 2,
  //   "city": {
  //     "id": 2801,
  //     "title": "Обь"
  //   },
  //   "country": {
  //     "id": 1,
  //     "title": "Россия"
  //   },
  //   "photo_100": "https://sun4-16.userapi.com/impf/c622220/v622220431/1ef0b/eE9frixxpWQ.jpg?size=100x0&quality=88&crop=192,311,496,496&sign=31cd07ba2fcad66bfc4602072c1d2843&ava=1",
  //   "photo_max_orig": "https://sun4-16.userapi.com/impf/c622220/v622220431/1ef0b/eE9frixxpWQ.jpg?size=0x0&quality=90&crop=192,311,496,600&sign=1653ca457df49480da802d9a069c3c14&ava=1",
  //   "bdate": "27.11.1989",
  //   "photo_200": "https://sun4-16.userapi.com/impf/c622220/v622220431/1ef0b/eE9frixxpWQ.jpg?size=200x0&quality=88&crop=192,311,496,496&sign=9c9ca8248bd9bfb451ca681507c9f8db&ava=1",
  //   "timezone": 7
  // };
}

class Header extends React.Component{
  render(){
    return(<header>{this.props.textHeader}</header>)
  }
}

class Avatar extends React.Component{
 render(){
   const style = {
     backgroundImage: `url(${this.props.url})`
   };
   return (<div className="avatar" style={style}> </div>);
 }
}

class Name extends React.Component{
  render(){
    return (<div className="name">{this.props.name}</div>);
  }
}

class TextMessage extends React.Component{
  render(){
    return (<div className="text-message">{this.props.message}</div>);
  }
}


class UserMessage extends React.Component{
  componentDidMount(){
    const container = document.querySelector('.messages');
    container.scrollTop = container.scrollHeight;
  }

  render(){
    return (
      <article className="user-message">
        <Avatar url={this.props.value.avatar}/>
        <div className="message-wrap">
          <Name name={this.props.value.user}/>
          <TextMessage message={this.props.value.text}/>
        </div>
      </article>
    );
  }
}

class Messages extends React.Component{
  render(){
    return (
      <div className="messages">
        {this.props.value.map((msg, n)=> <UserMessage value={msg} key={n} />)}
      </div>
    );
  }
}

class Message extends React.Component{
  render(){
    return (<input type="text" className="message-input" onChange={this.props.onChange} value={this.props.text} />);
  }
}

class Counter extends React.Component{
  render(){
    return (
      <div className="counter">Пользователей онлайн: {this.props.count}</div>
    );
  }
}

class SendButton extends React.Component{
  render(){
    return (<button type="submit">Написать</button>);
  }
}

class Chat extends React.Component{
  constructor(props){
    super(props);

    this._user = {};
    this._socket = null;
    this._sound = null;

    this.state = {
      users: 0,
      messages: [],
      text: ''
    };

    this._init();
  }

  _init(){
    getUserData().then((user)=>{
      if(user.id){
        this._user = {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          avatar: user.photo_100
        };

        this._socketsHandlers();
      }
    });
  }

  _playSound(){
    if(this._sound === null) this._sound = new Audio('sms.mp3');
    this._sound.play();
  }

  _socketsHandlers(){
    //this._socket = io('http://localhost:5000/?user=' + this._user.id);
    this._socket = io('https://chat-test-irs-server.herokuapp.com/?user=' + this._user.id);

    this._socket.on('get user data', (id)=>{
      if(String(this._user.id) === id) this._socket.emit('log in', this._user);
    });

    this._socket.on('chat message', (response) => {
      this.setState({
        messages: this._update(response)
      });

      this._playSound();
    });

    this._socket.on('counter change', (count) => {
      this.setState({
        users: count
      });
    });
  }

  _update(value){
    if(!(value instanceof Array)) value = [value];
    return this.state.messages.concat(value);
  }

  submitHandle(e){
    e.preventDefault();
    const message = this.state.text;

    if(message.trim() !== ''){
      this._socket.emit('chat message', {user: this._user.id, text: this.state.text});
      this.setState({
        text: ''
      });
    }
  }

  getText(e){
    this.setState({
      text: e.target.value
    });
  }

  render(){
    return (
      <div className="chat">
        <Header textHeader={this.props.app}/>
        <Messages value={this.state.messages}/>
        <div className="wrapper">
          <Counter count={this.state.users}/>
          <form onSubmit={e => this.submitHandle(e)}>
            <Message onChange={e => this.getText(e)} text={this.state.text}/>
            <SendButton/>
          </form>
        </div>
      </div>
    );
  }
}

ReactDOM.render(<Chat app="Мини-чат" />, document.querySelector("#root"));
