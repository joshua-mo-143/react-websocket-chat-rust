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
      <div className="flex flex-row text-gray-100">
        <div className='w-full bg-slate-700 flex flex-col pb-5' >
          <div className='w-full min-h-screen flex flex-col justify-end gap-4 pb-20' id="chatbox">
            <div className="mx-8 break-all chat-message bg-slate-600 rounded-xl rounded-xl w-fit inline-block px-5 py-4">
              <p>Hi! Welcome to Rustcord. Enjoy your stay!</p>
            </div>
          </div>
          <form className='w-full h-10 fixed bottom-0 flex flex-row mb-5 px-5' onSubmit={(e) => sendMessage(e, name, message, setMessage)}>
            <input name="message" id="messageBox" type="text" className='bg-slate-400 w-full py-2 px-5 focus:outline-0 rounded-tl-xl rounded-bl-xl' value={message}
              placeholder="Enter your message here..."
              onInput={(e: React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)} />
            <button id="messageBtn" className='bg-slate-400 px-2 active:translate-y-0.5 active:translate-x-0.5 hover:text-black transition-all rounded-tr-xl rounded-br-xl'>
              Send
            </button>
          </form>
        </div>
      </div>
    </>

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
const message_classes = "mx-8 break-all chat-message bg-slate-600 rounded-xl w-fit max-w-screen rounded-xl px-5 py-4".split(" ");
const username_css_classes = "text-gray-200 text-sm".split(" ");

const create_message = (data: Message) => {
  let messageContainer = document.createElement('div');
  messageContainer.classList.add(...message_classes);
  let chatbox = document.querySelector('#chatbox');
  let username = document.createElement('span');
  username.classList.add(...username_css_classes);
  username.innerText = `${data.name}`;
  messageContainer.append(username);
  let message = document.createElement('p');
  message.innerText = `${data.message}`;
  messageContainer.append(message);
  chatbox?.append(messageContainer);
  window.scrollTo(0, document.body.scrollHeight);
}