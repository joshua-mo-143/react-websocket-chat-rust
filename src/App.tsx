import { create } from 'domain';
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
        {/* <div className='w-1/5 h-screen bg-stone-700 flex flex-col items-center justify-between font-bold text-stone-300'>
          <ul className='mx-5'>
            <p className='text-xl mt-5'></p>


          </ul>
          <p className='mb-5'>Welcome to Rustcord, {name}!</p>
        </div> */}
        <div className='w-full h-screen bg-stone-300' >
          <div className='w-full min-h-screen flex flex-col justify-end gap-4 flex-grow-0 box-content' id="chatbox">
          </div>
          <form className='w-full h-10 fixed bottom-0 flex flex-row justify-center gap-4 mb-5' onSubmit={(e) => sendMessage(e,name, message, setMessage)}>
            <input name="message" id="messageBox" type="text" className='w-4/5 py-2 px-5 rounded-xl' value={message}
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
  websocket.send(
    JSON.stringify({
      name: name,
      message: message
    })
  );
  setMessage("")
}

const websocket = new WebSocket(`ws://localhost:9999/ws`);

websocket.onopen = () => {

}

websocket.onclose = () => {

}

websocket.onmessage = (ev) => {
  let meme = JSON.parse(ev.data);
  create_message(meme);
}

const create_message = (data: Message) => {
  let meme = document.createElement('div');
  meme.classList.add(...message_classes);
  let chatbox = document.querySelector('#chatbox');
  let message = document.createElement('p');
  message.innerText = `${data.name}: ${data.message}`;
  meme.append(message);
  chatbox?.append(meme);
}

const message_classes = ['mx-16', 'break-words', 'bg-stone-400', 'px-5', 'py-2', 'chat-message', 'rounded-xl'];