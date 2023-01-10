import React from 'react'
import NamePrompt from './components/NamePrompt';

function App() {

  const [message, setMessage] = React.useState<string>("");

  const sendMessage = (e:React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (message == "") {
      return
    }
    console.log("Hello world");
    setMessage("");

    
  }

  return (

    <>
    <NamePrompt/>
    <div className="flex flex-row">
    <div className='w-1/5 h-screen bg-stone-500 flex flex-col items-center'>
      <p className='text-xl mt-5'>Rules:</p>
      <ul className='mx-5'>
        <li>1. Don't be rude to other people in the chat.</li>
        <li>2. Don't spam the chat or post advertising links. Nobody likes that.</li>
        <li>3. Use common sense. If you constantly stir up drama or offend people, expect a warning from the moderators.</li>
      </ul>
    </div>
    <div className='w-4/5 h-screen bg-stone-300 flex flex-col justify-end'>
      <form className='w-full h-10 flex flex-row justify-center gap-4 mb-5' onSubmit={(e) => sendMessage(e)}>
        <input name="message" id="messageBox" type="text" className='w-4/5 py-2 px-5 rounded-xl' value={message}
         onInput={(e:React.ChangeEvent<HTMLInputElement>) => setMessage(e.target.value)}/>
        <button id="messageBtn" className='bg-blue-500 px-2 rounded-xl active:translate-y-0.5 active:translate-x-0.5 hover:bg-blue-300 transition-all'>Send Message</button>
      </form>
    </div>
    </div></>

  )
}

export default App
