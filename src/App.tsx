import React, { SetStateAction } from 'react'
import NamePrompt from './components/NamePrompt';

type Message = {
  name: string,
  uid: number,
  message: string
}
function App() {
  const [name, setName] = React.useState<string>("");
  const [vis, setVis] = React.useState<boolean>(true);

  const [message, setMessage] = React.useState<string>("");


  return (

    <>
      <NamePrompt vis={vis} name={name} setName={setName} setVis={setVis} />
      <div className="flex flex-row">
        <div className='w-full bg-stone-300 flex flex-col pb-5' >
          <div className='w-full min-h-screen flex flex-col justify-end gap-4 pb-20' id="chatbox">
          </div>
          <form className='w-full h-10 fixed bottom-0 flex flex-row justify-center gap-4 mb-5 px-5' onSubmit={(e) => sendMessage(e,name, message, setMessage)}>
            <input name="message" id="messageBox" type="text" className='w-4/5 py-2 px-5 rounded-xl' value={message}
              placeholder="Enter your message here..."
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)} />
            <button id="messageBtn" className='bg-blue-500 px-2 rounded-xl active:translate-y-0.5 active:translate-x-0.5 hover:bg-blue-300 transition-all'>Send Message</button>
          </form>
        </div>
      </div></>

  )
}

export default App

const sendMessage = (e: React.FormEvent<HTMLFormElement>, name: string, message: string, setMessage: React.Dispatch<SetStateAction<string>>) => {
  e.preventDefault()
  // if user hasn't entered anything in to send, do nothing
  if (message.trim() == "") {
    return
  }
  // Send a websocket message to the server
  websocket.send(
    JSON.stringify({
      name: name,
      message: message
    })
  );
  // Reset message input box
  setMessage("")
}

// Set up the websocket URL. 
const wsUri = ((window.location.protocol == "https:" && "wss://") || "ws://") +
  window.location.host +
  "/ws";

const websocket = new WebSocket(wsUri);

// On open, do nothing - console.log() can be added for debugging purposes
websocket.onopen = () => {

}

// On close, do nothing - console.log() can be added for debugging purposes
websocket.onclose = () => {

}

// On receiving a message from the server, parse the data and then create an entry in the chat
websocket.onmessage = (ev) => {
  let message = JSON.parse(ev.data);
  create_message(message);
}

// store the message classes as an array
const message_classes = ['mx-16', 'break-words', 'bg-stone-400', 'px-5', 'py-2', 'chat-message', 'rounded-xl'];

const create_message = (data: Message) => {
  let messageContainer = document.createElement('div');
  messageContainer.classList.add(...message_classes);
  let chatbox = document.querySelector('#chatbox');
  let message = document.createElement('p');
  message.innerText = `${data.name}: ${data.message}`;
  messageContainer.append(message);
  chatbox?.append(messageContainer);
  window.scrollTo(0, document.body.scrollHeight);
}